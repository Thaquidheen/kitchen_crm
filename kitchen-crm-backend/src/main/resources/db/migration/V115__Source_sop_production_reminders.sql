-- The two SOP reminders a production job creates ("30th-day site verification" and "Procure
-- accessories & hardware") were saved with source = MANUAL because createSopReminders never set a
-- source. Tag them PRODUCTION so they sit under the Production chip and so deleting a job can
-- purge every reminder it created (DELETE /production-installation/customer/{id} removes
-- source = PRODUCTION rows for that customer).
--
-- Data-only: no schema change, and PRODUCTION is an existing enum value in every deployed jar,
-- so the previously deployed jar validates and runs unchanged — rollback stays jar-only.
-- ASCII LIKE prefixes on purpose: the titles contain an em dash after the fixed text.
UPDATE customer_reminders
SET source = 'PRODUCTION'
WHERE source = 'MANUAL'
  AND customer_id IS NOT NULL
  AND (title LIKE '30th-day site verification%' OR title LIKE 'Procure accessories & hardware%');
