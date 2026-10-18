import unittest, sys, pathlib
sys.path.insert(0,str(pathlib.Path(__file__).resolve().parents[1]/'scripts'))
from update_data import normalize, expected_dates
import datetime as dt
class ImportTests(unittest.TestCase):
 def test_parse(self):
  d=normalize(dict(game_id='LAPR',id_sorteo='a',fecha_sorteo='2026-01-01',combinacion='06 - 02 - 03 - 04 - 05 - 01 C(7) R(0)'))
  self.assertEqual(d['numbers'],[1,2,3,4,5,6]); self.assertEqual(d['refund'],0)
 def test_bad_data(self):
  with self.assertRaises(ValueError):normalize(dict(game_id='LAPR',combinacion='sin resultado'))
 def test_calendar(self):
  self.assertEqual(list(expected_dates(dt.date(2026,1,5))),['2026-01-01','2026-01-03','2026-01-05'])
