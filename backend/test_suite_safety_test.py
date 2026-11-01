import unittest

from test_suite_safety import is_loopback_target, target_safety_error


class TestSuiteSafetyTests(unittest.TestCase):
    def test_loopback_target_is_allowed_without_remote_opt_in(self):
        self.assertTrue(is_loopback_target("http://localhost:8080/api"))
        self.assertTrue(is_loopback_target("http://127.0.0.1:8080/api"))
        self.assertTrue(is_loopback_target("http://[::1]:8080/api"))
        self.assertIsNone(target_safety_error("http://localhost:8080/api", False, False, False))

    def test_remote_mutations_require_explicit_staging_opt_in(self):
        message = target_safety_error("https://api.woodyz.example/api", False, False, False)
        self.assertIn("remote write-capable audit blocked", message)
        self.assertIsNone(target_safety_error("https://staging.woodyz.example/api", True, False, False))

    def test_live_payment_requires_a_second_explicit_opt_in(self):
        message = target_safety_error("http://localhost:8080/api", False, True, False)
        self.assertIn("live payment test blocked", message)
        self.assertIsNone(target_safety_error("http://localhost:8080/api", False, True, True))


if __name__ == "__main__":
    unittest.main()
