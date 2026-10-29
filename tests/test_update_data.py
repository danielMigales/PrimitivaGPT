import datetime as dt
import unittest
from zoneinfo import ZoneInfo

from scripts.update_data import latest_scheduled_date, missing_expected_draw, should_wait_for_results, sorted_draws


MADRID = ZoneInfo('Europe/Madrid')


class UpdateDataScheduleTests(unittest.TestCase):
    def test_empty_archive_fails_clearly_instead_of_index_error(self):
        with self.assertRaisesRegex(ValueError, 'ningún sorteo válido'):
            sorted_draws({})

    def test_latest_scheduled_date_is_previous_saturday_on_sunday(self):
        self.assertEqual(
            latest_scheduled_date(dt.date(2026, 10, 18)),
            dt.date(2026, 10, 17),
        )

    def test_waits_until_2300_on_draw_day(self):
        now = dt.datetime(2026, 10, 19, 22, 59, tzinfo=MADRID)
        wait, reason = should_wait_for_results(now, '2026-10-17')
        self.assertTrue(wait)
        self.assertIn('Esperando', reason)

    def test_allows_check_after_2300_on_draw_day(self):
        now = dt.datetime(2026, 10, 19, 23, 1, tzinfo=MADRID)
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

    def test_catches_up_previous_missing_draw_before_today_results_time(self):
        # El jueves 29 aún no hay resultado de ese día, pero falta el lunes 26.
        now = dt.datetime(2026, 10, 29, 22, 0, tzinfo=MADRID)
        wait, _ = should_wait_for_results(now, '2026-10-24')
        self.assertFalse(wait)

    def test_waits_for_today_only_when_previous_scheduled_draw_is_archived(self):
        now = dt.datetime(2026, 10, 29, 22, 0, tzinfo=MADRID)
        wait, reason = should_wait_for_results(now, '2026-10-26')
        self.assertTrue(wait)
        self.assertIn('Esperando', reason)

    def test_fails_closed_when_expected_draw_is_missing_after_publication_day(self):
        now = dt.datetime(2026, 10, 20, 10, 0, tzinfo=MADRID)
        self.assertTrue(missing_expected_draw(now, '2026-10-17'))

    def test_does_not_fail_before_results_time_on_draw_day(self):
        now = dt.datetime(2026, 10, 19, 22, 59, tzinfo=MADRID)
        self.assertFalse(missing_expected_draw(now, '2026-10-17'))

    def test_fails_if_scheduled_draw_is_still_missing_after_2300(self):
        now = dt.datetime(2026, 10, 19, 23, 1, tzinfo=MADRID)
        self.assertTrue(missing_expected_draw(now, '2026-10-17'))


if __name__ == '__main__':
    unittest.main()
