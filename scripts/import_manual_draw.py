#!/usr/bin/env python3
"""Importa un sorteo manual de La Primitiva enviado mediante una incidencia de GitHub."""
import datetime as dt
import json
import os
import pathlib
import re
from zoneinfo import ZoneInfo

ROOT = pathlib.Path(__file__).resolve().parents[1]
MADRID = ZoneInfo('Europe/Madrid')

def parse_issue(body, archive):
    fields = {}
    for line in re.split(r'[\n;]+', body or ''):
        match = re.match(r'^\s*(Fecha|Números|Numeros|Complementario|Reintegro)\s*:\s*(.*?)\s*$', line, re.I)
        if match:
            key = match.group(1).lower().replace('ú', 'u')
            fields[key] = match.group(2)
    required = ('fecha', 'numeros', 'complementario', 'reintegro')
    if any(not fields.get(key) for key in required):
        raise ValueError('Faltan campos. Debe incluir Fecha, Números, Complementario y Reintegro.')
    try:
        day = dt.date.fromisoformat(fields['fecha'])
    except ValueError:
        raise ValueError('La fecha debe tener formato AAAA-MM-DD.') from None
    today = dt.datetime.now(MADRID).date()
    if day < dt.date(2026, 1, 1) or day > today:
        raise ValueError('La fecha debe estar entre 2026-01-01 y hoy.')
    if day.weekday() not in (0, 3, 5):
        raise ValueError('La Primitiva solo celebra sorteos lunes, jueves y sábado.')
    try:
        numbers = [int(x) for x in re.split(r'[,;\s]+', fields['numeros'].strip()) if x]
        complementary = int(fields['complementario'])
        refund = int(fields['reintegro'])
    except ValueError:
        raise ValueError('Los números y extras deben ser valores enteros.') from None
    if len(numbers) != 6 or len(set(numbers)) != 6 or any(n < 1 or n > 49 for n in numbers):
        raise ValueError('Introduce exactamente seis números distintos del 1 al 49.')
    if not 1 <= complementary <= 49 or complementary in numbers:
        raise ValueError('El complementario debe estar entre 1 y 49 y no repetir un número principal.')
    if not 0 <= refund <= 9:
        raise ValueError('El reintegro debe estar entre 0 y 9.')
    draws = archive.get('draws', [])
    latest = max((str(row.get('date', '')) for row in draws), default='')
    if latest and day.isoformat() <= latest:
        raise ValueError(f'La fecha debe ser posterior al último sorteo guardado ({latest}).')
    months = ('enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre')
    return {'id': day.strftime('%Y%m%d'), 'date': day.isoformat(), 'numbers': sorted(numbers),
            'complementary': complementary, 'refund': refund, 'source': '', 'manual': True, 'entryMethod': 'manual'}

def main():
    body = os.environ.get('ISSUE_BODY', '')
    path = ROOT / 'data/draws.json'
    archive = json.loads(path.read_text(encoding='utf-8'))
    record = parse_issue(body, archive)
    archive['draws'].append(record)
    archive['draws'].sort(key=lambda row: row['date'], reverse=True)
    archive['latestDate'] = archive['draws'][0]['date']
    archive['checkedAt'] = dt.datetime.now(dt.timezone.utc).isoformat(timespec='seconds').replace('+00:00', 'Z')
    path.write_text(json.dumps(archive, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f"Sorteo incorporado: {record['date']} · {', '.join(map(str, record['numbers']))} · C {record['complementary']} · R {record['refund']}")

if __name__ == '__main__':
    main()
