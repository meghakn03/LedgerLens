import unittest
from copy import deepcopy

import app as ledgerlens


class RulesTests(unittest.TestCase):
    def test_large_purchase_matches_high_value_rule(self):
        matches = ledgerlens.matching_rules({"amount": 1000, "velocity_count": 0, "velocity_window_minutes": 0})
        self.assertEqual([rule["id"] for rule in matches], ["high-value"])

    def test_velocity_requires_count_and_window(self):
        matches = ledgerlens.matching_rules({"amount": 25, "velocity_count": 4, "velocity_window_minutes": 10})
        self.assertEqual([rule["id"] for rule in matches], ["velocity"])
        no_match = ledgerlens.matching_rules({"amount": 25, "velocity_count": 4, "velocity_window_minutes": 11})
        self.assertEqual(no_match, [])

    def test_seed_data_is_evaluated_by_the_rules(self):
        flagged = [row for row in ledgerlens.transactions if row["status"] == "Needs review"]
        self.assertEqual(len(flagged), 4)
        self.assertTrue(all(row["alerts"] for row in flagged))


class ApiBehaviorTests(unittest.TestCase):
    def setUp(self):
        self.original_transactions = deepcopy(ledgerlens.transactions)

    def tearDown(self):
        ledgerlens.transactions[:] = self.original_transactions

    def test_list_filter_and_search(self):
        result = ledgerlens.list_transactions(status="Needs review", q="Northstar")
        self.assertEqual(result["total"], 1)
        self.assertEqual(result["items"][0]["id"], "TXN-90841")
        self.assertTrue(result["synthetic"])

    def test_review_stores_note_in_memory(self):
        result = ledgerlens.review_transaction("TXN-90841", ledgerlens.ReviewNote(note="Confirmed for the demo"))
        self.assertEqual(result["item"]["status"], "Reviewed")
        self.assertEqual(result["item"]["note"], "Confirmed for the demo")
        self.assertIn("reviewed_at", result["item"])

    def test_unknown_transaction_is_not_found(self):
        with self.assertRaises(ledgerlens.HTTPException) as error:
            ledgerlens.review_transaction("missing", ledgerlens.ReviewNote())
        self.assertEqual(error.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
