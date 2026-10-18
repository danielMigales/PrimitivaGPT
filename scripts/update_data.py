"""Descarga mensual, valida y conserva el histórico oficial de SELAE."""
import calendar, datetime as dt, json, pathlib, re, time, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[1]
START = dt.date(2026, 1, 1)
BASE = 'https://www.loteriasyapuestas.es/servicios/buscadorSorteos'

def normalize(row):
    match = re.fullmatch(r'\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\s+C\((\d+)\)\s+R\((\d+)\)\s*', row.get('combinacion', ''))
    if not match or row.get('game_id') != 'LAPR':
        raise ValueError('Registro SELAE no reconocido')
    values = list(map(int, match.groups()))
    nums, c, r = values[:6], values[6], values[7]
    if len(set(nums)) != 6 or not all(1 <= n <= 49 for n in nums) or not 1 <= c <= 49 or c in nums or not 0 <= r <= 9:
        raise ValueError('Combinación inválida')
    date = str(dt.date.fromisoformat(row['fecha_sorteo'][:10]))
    if date < START.isoformat():
        raise ValueError('Fecha anterior al inicio del histórico')
    return dict(id=str(row['id_sorteo']), date=date, numbers=sorted(nums), complementary=c, refund=r,
                source='https://www.loteriasyapuestas.es/f/loterias/resultados/primitiva.html?game_id=LAPR&fecha_sorteo='+date.replace('-', ''))

def expected_dates(end):
    day = START
    while day <= end:
        if day.weekday() in (0, 3, 5):
            yield day.isoformat()
        day += dt.timedelta(days=1)

def main():
    from zoneinfo import ZoneInfo
    today = dt.datetime.now(ZoneInfo('Europe/Madrid')).date()
    path = ROOT/'data/draws.json'
    previous = json.loads(path.read_text()) if path.exists() else {'draws': []}
    merged = {r['date']: r for r in previous['draws']}
    raw_files = []
    for month in range(1, 13):
        begin = dt.date(2026, month, 1)
        if begin > today:
            break
        end = min(today, dt.date(2026, month, calendar.monthrange(2026, month)[1]))
        # A partir de 2027 se recorren también los años siguientes.
        raw_files.append((begin, end))
    for year in range(2027, today.year+1):
        for month in range(1,13):
            begin = dt.date(year,month,1)
            if begin <= today:
                raw_files.append((begin,min(today,dt.date(year,month,calendar.monthrange(year,month)[1]))))
    for begin, end in raw_files:
        url = BASE+f'?game_id=LAPR&celebrados=true&fechaInicioInclusiva={begin:%Y%m%d}&fechaFinInclusiva={end:%Y%m%d}'
        for attempt in range(3):
            try:
                req = urllib.request.Request(url)
                with urllib.request.urlopen(req, timeout=45) as res:
                    rows = json.load(res)
                if not isinstance(rows, list):
                    raise ValueError('SELAE no ha devuelto una lista')
                for row in rows:
                    record = normalize(row)
                    if not begin.isoformat() <= record['date'] <= end.isoformat():
                        raise ValueError('SELAE devuelve una fecha fuera del intervalo solicitado')
                    merged[record['date']] = record
                raw = ROOT/f'data/raw/{begin:%Y-%m}.json'
                raw.parent.mkdir(parents=True,exist_ok=True)
                raw.write_text(json.dumps(rows, ensure_ascii=False,indent=2)+'\n')
                print(f'{begin:%Y-%m}: {len(rows)} sorteos', flush=True)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(2)
    draws = sorted(merged.values(), key=lambda r:r['date'], reverse=True)
    if not draws:
        raise ValueError('Histórico vacío; no se publica')
    # Comprobación de cobertura según el calendario habitual, hasta el último resultado publicado.
    end = dt.date.fromisoformat(draws[0]['date'])
    missing = sorted(set(expected_dates(end)) - merged.keys())
    if missing:
        raise ValueError('Faltan sorteos en el calendario habitual: '+', '.join(missing))
    if len({r['id'] for r in draws}) != len(draws):
        raise ValueError('Identificadores duplicados')
    doc = dict(schemaVersion=1, startDate=str(START), source='SELAE',
               checkedAt=dt.datetime.now(dt.timezone.utc).isoformat(), latestDate=draws[0]['date'], draws=draws)
    tmp=path.with_suffix('.tmp')
    tmp.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n')
    tmp.replace(path)
    print(f'Histórico validado: {len(draws)} sorteos; último {draws[0]["date"]}')

if __name__ == '__main__':
    main()
