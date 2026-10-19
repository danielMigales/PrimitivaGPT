import datetime as dt
import unittest
from zoneinfo import ZoneInfo

from scripts.update_data import latest_scheduled_date, should_wait_for_results


MADRID = ZoneInfo('Europe/Madrid')


class UpdateDataScheduleTests(unittest.TestCase):
    def test_latest_scheduled_date_is_previous_saturday_on_sunday(self):
        self.assertEqual(
            latest_scheduled_date(dt.date(2026, 10, 18)),
            dt.date(2026, 10, 17),
        )

    def test_waits_before_results_window_on_draw_day(self):
        now = dt.datetime(2026, 10, 19, 21, 0, tzinfo=MADRID)
        wait, reason = should_wait_for_results(now, '2026-10-17')
        self.assertTrue(wait)
        self.assertIn('Esperando', reason)

    def test_allows_check_after_results_window_on_draw_day(self):
        now = dt.datetime(2026, 10, 19, 22, 31, tzinfo=MADRID)
        wait, _ = should_wait_for_results(now, '2026-10-17')
        self.assertFalse(wait)

    def test_skips_when_archive_already_has_latest_scheduled_draw(self):
        now = dt.datetime(2026, 10, 20, 10, 0, tzinfo=MADRID)
        wait, reason = should_wait_for_results(now, '2026-10-19')
        self.assertTrue(wait)
        self.assertIn('ya llega', reason)

    def test_checks_if_expected_draw_is_missing_from_archive(self):
        now = dt.datetime(2026, 10, 20, 10, 0, tzinfo=MADRID)
        wait, _ = should_wait_for_results(now, '2026-10-17')
        self.assertFalse(wait)


if __name__ == '__main__':
    unittest.main()
