# Prompt cache (cost optimization)

After each successful step that uses the LLM (click, checkbox, fill_form fields), the exact prompt that worked is saved here per exam:

- `neet_ug.json` – cached prompts for NEET UG
- `cuet_ug.json` – cached prompts for CUET UG (when used)

**First run:** Uses prompts from the playbook; LLM runs for each step. Successful prompts are written to the cache.

**Later runs:** If a cache entry exists for a step (or form field), that prompt is reused so the same instruction is sent every time (no need to regenerate; same prompt = consistent behavior and faster/cheaper when using a fast model).

You can delete a cache file to force a fresh “learn” run, or edit it to adjust a saved prompt.
