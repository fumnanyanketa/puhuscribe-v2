"""Canonical YKI topic plan (must match supabase topics.slug exactly).

Used by run_batch.py to generate content per topic and by to_seed_sql.py to map
each item back to topics.slug when emitting the seed SQL.
"""
from __future__ import annotations

# (slug, English name). Slugs mirror supabase/migrations/20260603000002_yki_topics_seed.sql.
TOPICS: list[tuple[str, str]] = [
    ("greetings", "Greetings & introductions"),
    ("family", "Family & relationships"),
    ("home", "Home & housing"),
    ("food_drink", "Food & drink"),
    ("shopping", "Shopping"),
    ("daily_routines", "Daily routines & free time"),
    ("health", "Health & healthcare"),
    ("transport", "Transport & travel"),
    ("weather", "Weather & seasons"),
    ("hobbies", "Hobbies & sports"),
    ("events", "Events & celebrations"),
    ("work_general", "Work & profession"),
    ("workplace", "Workplace & colleagues"),
    ("job_search", "Job seeking & CV"),
    ("education", "Education & study"),
    ("technology", "Technology & digital life"),
    ("banking", "Banking & money"),
    ("post_office", "Post & parcels"),
    ("housing_services", "Housing services & officials"),
    ("emergency", "Emergencies & safety"),
    ("city_life", "City life & environment"),
    ("media_news", "Media & news"),
    ("integration", "Integration & culture"),
    ("rights_duties", "Rights & duties"),
    ("yki_exam_prep", "YKI exam preparation"),
]
