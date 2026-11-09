# Data sources (data.gov.il)

All data comes from the Israeli Government open-data portal (CKAN), published by the Ministry of Transport (`ministry_of_transport`).
Verified live on **2026-11-05** with `package_show` and `datastore_search`. Most resources are refreshed **daily** (~03:35 UTC).

- Base URL: `https://data.gov.il/api/3/action/`
- Lookup: `datastore_search?resource_id=<id>&filters={"<plateField>":<plate>}&limit=<n>` (exact match, no fuzzy `q`)
- Attribution: **"מקור: data.gov.il"**. Licenses are "Other (Open)", except the disabled-permit dataset, which is CC-BY.
- Resource IDs live in [`apps/api/src/config/datasets.ts`](../apps/api/src/config/datasets.ts).

## Summary

| #   | Dataset (package)                                                                         | Resource ID                            | Plate field                                              | Rows | Status                           |
| --- | ----------------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------------- | ---- | -------------------------------- |
| 1   | Private & commercial registry (`private-and-commercial-vehicles`)                         | `053cea08-09bc-40ec-8f7a-156f0677aff3` | `mispar_rechev`                                          | 4.2M | ✅                               |
| 1b  | Registry, continued: tire load/speed, tow hook (same package)                             | `0866573c-40cd-4ca8-91d2-9dd2d7a492e5` | `mispar_rechev`                                          | 4.2M | ✅ optional                      |
| 2   | Vehicle history (`shinui_mivne`, resource "(1)")                                          | `56063a99-8a3e-4ff4-912e-5966c0279bad` | `mispar_rechev`                                          | 2.5M | ✅                               |
| 3   | Ownership history (`shinui_mivne`, resource "(2)")                                        | `bb2355dc-9ec7-4f06-9c3f-3344672171da` | `mispar_rechev`                                          | 5.6M | ✅                               |
| 4   | Open recalls, not yet fixed (`hagbalat_recall`)                                           | `36bf1404-0be4-49d2-82dc-2f1ead4a8b93` | `MISPAR_RECHEV`                                          | 161K | ✅                               |
| 4b  | Recall notices from manufacturers (`recall`), joined by `RECALL_ID`                       | `2c33523f-87aa-44ec-a736-edbb0a82975e` | `RECALL_ID`                                              | 3.6K | ✅ enrichment                    |
| 5   | Removed from road, final cancellation, 2010+ (`reshev_bitul_sofi`)                        | `851ecab1-0622-4dbe-a6c7-f950cf82abf9` | `mispar_rechev` (numeric)                                | 1.2M | ✅                               |
| 5b  | Same, legacy 2010–2016                                                                    | `4e6b9724-4c1e-43f0-909a-154d4cc4e046` | `mispar_rechev` (**text, zero-padded to 8**)             | 670K | ✅                               |
| 5c  | Same, legacy 2000–2009                                                                    | `ec8cbc34-72e1-4b69-9c48-22821ba0bd6c` | `mispar_rechev` (**text, zero-padded to 8**)             | 500K | ✅                               |
| 6   | Stolen vehicles                                                                           | —                                      | —                                                        | —    | ❌ **not published** (see below) |
| 7   | Disabled parking permit (`rechev-tag-nachim`)                                             | `c8b9f9c8-4612-4068-934f-d4acd2e3c06e` | `MISPAR RECHEV` (**contains a space**)                   | 639K | ✅                               |
| 8   | WLTP / model specs (`degem-rechev-wltp`)                                                  | `142afde2-6228-49f9-8a29-9b6c3a0cbe40` | join: `tozeret_cd`+`degem_cd`+`shnat_yitzur`+`sug_degem` | 102K | ✅                               |
| 9a  | Two-wheelers (`motorcycle`)                                                               | `bf9df4e2-d90d-4c0a-a400-19e15af8e95f` | `mispar_rechev`                                          | 193K | ✅ fallback                      |
| 9b  | Over 3.5 t, and vehicles without a model code (`heavy-truck`)                             | `cd3acc5c-03c3-4c89-9c54-d40f93c0d790` | `mispar_rechev`                                          | 425K | ✅ fallback                      |
| 9c  | Inactive (no valid license for 13+ months), with model code (`rechev_le_pail_with_degem`) | `f6efe89a-fb3d-43a4-bb61-9bf12a9b9099` | `mispar_rechev`                                          | 611K | ✅ fallback (same schema as #1)  |
| 9d  | Inactive, without model code (`rechev_le_pail_without-degem`)                             | `6f6acd03-f351-4a8f-8ecf-df792f4f573a` | `mispar_rechev`                                          | 1.4M | ✅ fallback                      |
| 9e  | Personal import (`personal_import_vehicles`)                                              | `03adc637-b6fe-402b-9937-7c3d3afc9140` | `mispar_rechev`                                          | 27K  | ✅ fallback                      |
| 9f  | Active public vehicles: buses, taxis (`kli_rechev_ciburiim`)                              | `cf29862d-ca25-4691-84f6-1be60dcb4a1e` | `mispar_rechev`                                          | 66K  | ✅ fallback                      |

### Verified behaviour

- **Exact filters work** on every resource. A string filter on a numeric field also matches (`{"mispar_rechev":"3432273"}` → 1 row).
- The **legacy off-road resources (5b, 5c) store plates as zero-padded 8-character text**: `"03602428"` matches and `"3602428"` doesn't.
- **Field-name casing differs between datasets**: `mispar_rechev`, `MISPAR_RECHEV`, and `MISPAR RECHEV` (with a space).
- **Upstream latency** was 0.3–4.5 s per call, with all 13 queried in parallel. The 8 s timeout is reasonable.
- `datastore_search_sql` is **blocked** (it returns an HTML page). `distinct=true` works, but returns incomplete results.
- **Plates shorter than 5 digits exist.** For example, plate `870` is a 1955 Chevrolet in the heavy-vehicle registry.

### Test plates (real, verified)

| Plate      | Found in                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| `36181801` | registry, history, ownership (9 rows), WLTP join → Skoda Octavia RS 2017 |
| `3432273`  | registry, WLTP join; no history/ownership rows (2010 car)                |
| `1000822`  | recalls (2), inactive registry                                           |
| `8959871`  | off-road (2026-10-29)                                                    |
| `50096`    | disabled permit, heavy registry                                          |
| `35462701` | motorcycle registry                                                      |
| `14817`    | history and ownership only, personal import (not in the main registry)   |

---

## 1. Private & commercial vehicle registry

Active private vehicles from 1996 and later, and commercial vehicles ≤3,500 kg from 1998 and later.
Resource `053cea08-09bc-40ec-8f7a-156f0677aff3`. The same schema is used by **9c** (inactive vehicles with a model code).

| Field                       | English label                           | Notes                                          |
| --------------------------- | --------------------------------------- | ---------------------------------------------- |
| `mispar_rechev`             | Plate                                   | numeric                                        |
| `tozeret_cd`                | Manufacturer code                       | WLTP join key                                  |
| `tozeret_nm`                | Manufacturer (Hebrew, includes country) | e.g. `סוזוקי הונגריה`                          |
| `sug_degem`                 | Model type                              | `P` = private, `M` = commercial; WLTP join key |
| `degem_cd`                  | Model code                              | WLTP join key                                  |
| `degem_nm`                  | Model name (technical)                  | e.g. `MZC21`                                   |
| `kinuy_mishari`             | Commercial name                         | e.g. `SWIFT`                                   |
| `ramat_gimur`               | Trim level                              | raw                                            |
| `ramat_eivzur_betihuty`     | Safety equipment level                  | numeric, often null                            |
| `kvutzat_zihum`             | Pollution group                         | 1–15                                           |
| `shnat_yitzur`              | Year of manufacture                     | WLTP join key                                  |
| `degem_manoa`               | Engine model                            |                                                |
| `mivchan_acharon_dt`        | Last annual test date                   | `YYYY-MM-DD`                                   |
| `tokef_dt`                  | License valid until                     | `YYYY-MM-DD`                                   |
| `baalut`                    | Current ownership type                  | see ownership values below                     |
| `misgeret`                  | VIN / chassis number                    |                                                |
| `tzeva_cd`                  | Color code                              |                                                |
| `tzeva_rechev`              | Color (Hebrew)                          | keep raw, e.g. `כסף מטלי`                      |
| `zmig_kidmi` / `zmig_ahori` | Front / rear tire                       |                                                |
| `sug_delek_nm`              | Fuel type (Hebrew)                      | `בנזין`, `דיזל`, `חשמל`, hybrid variants…      |
| `horaat_rishum`             | Registration directive no.              |                                                |
| `moed_aliya_lakvish`        | On road since                           | `YYYY-M` (month not zero-padded)               |

```json
{
  "_id": 1,
  "mispar_rechev": 3432273,
  "tozeret_cd": 299,
  "sug_degem": "P",
  "tozeret_nm": "סוזוקי הונגריה",
  "degem_cd": 21,
  "degem_nm": "MZC21",
  "ramat_gimur": "GLX",
  "ramat_eivzur_betihuty": null,
  "kvutzat_zihum": 15,
  "shnat_yitzur": 2010,
  "degem_manoa": "M15A",
  "mivchan_acharon_dt": "2026-06-16",
  "tokef_dt": "2027-06-08",
  "baalut": "פרטי",
  "misgeret": "TSMMZC21S00764846",
  "tzeva_cd": 29,
  "tzeva_rechev": "כסף מטלי",
  "zmig_kidmi": "185/60R15",
  "zmig_ahori": "185/60R15",
  "sug_delek_nm": "בנזין",
  "horaat_rishum": null,
  "moed_aliya_lakvish": "2010-6",
  "kinuy_mishari": "SWIFT"
}
```

**1b (continued)** `0866573c-…`: `kod_omes_tzmig_kidmi/ahori` (tire load index), `kod_mehirut_tzmig_kidmi/ahori` (tire speed rating), `grira_nm` (tow hook).

## 2. Vehicle history

Active private vehicles only, from 2017. Resource `56063a99-8a3e-4ff4-912e-5966c0279bad`.

| Field                   | English label             | Notes                                                                         |
| ----------------------- | ------------------------- | ----------------------------------------------------------------------------- |
| `mispar_rechev`         | Plate                     |                                                                               |
| `mispar_manoa`          | Engine number             |                                                                               |
| `kilometer_test_aharon` | Mileage at last test (km) |                                                                               |
| `shinui_mivne_ind`      | Structural change         | 0/1                                                                           |
| `gapam_ind`             | LPG conversion            | 0/1                                                                           |
| `shnui_zeva_ind`        | Color changed             | 0/1                                                                           |
| `shinui_zmig_ind`       | Tire size changed         | 0/1                                                                           |
| `rishum_rishon_dt`      | First registration date   | `YYYY-MM-DD`                                                                  |
| `mkoriut_nm`            | Origin                    | `""` (regular import) / `יבוא אישי-משומש` / `השכרה` / `החכר` / `ביס לנהיגה` … |

```json
{
  "_id": 1,
  "mispar_rechev": 36181801,
  "mispar_manoa": "DLB 012132",
  "kilometer_test_aharon": 114529,
  "shinui_mivne_ind": 1,
  "gapam_ind": 0,
  "shnui_zeva_ind": 1,
  "shinui_zmig_ind": 0,
  "rishum_rishon_dt": "2017-12-05",
  "mkoriut_nm": ""
}
```

## 3. Ownership history

Resource `bb2355dc-9ec7-4f06-9c3f-3344672171da`. There is one row per ownership period. Sort by `baalut_dt asc`.

| Field           | English label   | Notes                                                                                                   |
| --------------- | --------------- | ------------------------------------------------------------------------------------------------------- |
| `mispar_rechev` | Plate           |                                                                                                         |
| `baalut_dt`     | Ownership start | numeric **`YYYYMM`** (month precision only)                                                             |
| `baalut`        | Ownership type  | `פרטי` private · `חברה` company · `ליסינג` leasing · `השכרה` rental · `סוחר` dealer · `החכר` hire-lease |

```json
[
  { "mispar_rechev": 36181801, "baalut_dt": 201712, "baalut": "חברה" },
  { "mispar_rechev": 36181801, "baalut_dt": 201805, "baalut": "פרטי" },
  { "mispar_rechev": 36181801, "baalut_dt": 202001, "baalut": "סוחר" },
  { "mispar_rechev": 36181801, "baalut_dt": 202302, "baalut": "פרטי" }
]
```

No owner identities are published.

## 4. Open recalls (not performed for over 6 months after the importer's notice)

Resource `36bf1404-0be4-49d2-82dc-2f1ead4a8b93`.

| Field            | English label      | Notes                                                                                     |
| ---------------- | ------------------ | ----------------------------------------------------------------------------------------- |
| `MISPAR_RECHEV`  | Plate              | upper-case                                                                                |
| `RECALL_ID`      | Recall ID          | joins to 4b                                                                               |
| `SUG_RECALL`     | Recall kind        | `תקלה סידרתית בטיחותית` (safety defect) / `קמפיין שרות טכני` (technical service campaign) |
| `SUG_TAKALA`     | Defect category    | e.g. `כריות אוויר`                                                                        |
| `TEUR_TAKALA`    | Defect description | Hebrew free text                                                                          |
| `TAARICH_PTICHA` | Opened date        | `YYYY-MM-DD`                                                                              |

```json
{
  "_id": 2,
  "MISPAR_RECHEV": 1000822,
  "RECALL_ID": 12120,
  "SUG_RECALL": "תקלה סידרתית בטיחותית",
  "SUG_TAKALA": "כריות אוויר",
  "TEUR_TAKALA": "חשש הנוגע להתנהגות יחידת הניפוח של כרית אויר הנהג והנוסע",
  "TAARICH_PTICHA": "2017-11-27"
}
```

**4b. Recall notices** `2c33523f-…` (optional enrichment by `RECALL_ID`): `OFEN_TIKUN` (fix method), `YEVUAN_TEUR` (importer), `TELEPHONE`, `WEBSITE`, `BUILD_BEGIN_A` / `BUILD_END_A`.

## 5. Removed from road (final cancellation)

Resource `851ecab1-0622-4dbe-a6c7-f950cf82abf9`. The legacy resources 5b and 5c have the same fields, but every field is text.

Key fields: `mispar_rechev`, `bitul_dt` (cancellation date, `YYYY-MM-DD`), `sug_rechev_nm` (vehicle type), `tozeret_nm`, `degem_nm`, `kinuy_mishari`, `shnat_yitzur`, `misgeret`, `mispar_manoa`, `mishkal_kolel` (gross weight), `baalut`, `tzeva_rechev`, `sug_delek_nm`, `moed_aliya_lakvish` (**numeric year only** here).

```json
{
  "mispar_rechev": 8959871,
  "tozeret_nm": "טויוטה יפן",
  "degem_nm": "ZRE151L-AEPDKW",
  "sug_rechev_nm": "פרטי נוסעים",
  "moed_aliya_lakvish": 2010,
  "bitul_dt": "2026-10-29",
  "misgeret": "JTNBV58EX0J100975",
  "shnat_yitzur": 2010,
  "baalut": "פרטי",
  "tzeva_rechev": "כסף מטלי",
  "sug_delek_nm": "בנזין",
  "kinuy_mishari": "COROLLA"
}
```

## 6. Stolen vehicles: ❌ no public plate-level dataset

- No dataset matches `גנוב`, `גניבה`, `רכבים גנובים`, or `stolen`. The Israel Police org (`israel-police`) publishes only 4 datasets, all aggregate (crime statistics, station boundaries).
- The inactive-vehicle datasets (9c, 9d) state that stolen vehicles are **excluded** ("…לא גנובים וללא ביטול סופי").
- **Implication:** the stolen flag can't be determined from public data. See decision **D1** below.

## 7. Disabled parking permit

Resource `c8b9f9c8-4612-4068-934f-d4acd2e3c06e`. License: CC-BY.

| Field                 | English label     | Notes                                                      |
| --------------------- | ----------------- | ---------------------------------------------------------- |
| `MISPAR RECHEV`       | Plate             | **space in the field name**                                |
| `TAARICH HAFAKAT TAG` | Permit issue date | numeric `YYYYMMDD`                                         |
| `SUG TAV`             | Permit type code  | observed values `1` and one other; meaning is undocumented |

```json
{ "_id": 1, "MISPAR RECHEV": 50096, "TAARICH HAFAKAT TAG": 20230419, "SUG TAV": 1 }
```

## 8. WLTP / technical specs (model catalogue)

Resource `142afde2-6228-49f9-8a29-9b6c3a0cbe40`. It covers private models from 1996 and commercial models from 1998.
**Join:** `tozeret_cd` + `degem_cd` + `shnat_yitzur` + `sug_degem` from the registry. This was verified to return exactly 1 row for the test plates; without `sug_degem` it was also 1 row in the tests, but keep it to stay safe.

Subset used for the specs grid (the dataset has about 100 columns):

| Field                                                   | English label                                   |
| ------------------------------------------------------- | ----------------------------------------------- |
| `tozar` / `tozeret_eretz_nm`                            | Make / country of manufacture                   |
| `kinuy_mishari`, `ramat_gimur`                          | Commercial name, trim                           |
| `merkav`                                                | Body type                                       |
| `nefah_manoa`                                           | Engine displacement (cc)                        |
| `koah_sus`                                              | Horsepower                                      |
| `automatic_ind`                                         | Automatic transmission (0/1)                    |
| `hanaa_nm`                                              | Drive (e.g. 4X2)                                |
| `technologiat_hanaa_nm`                                 | Propulsion technology (regular/hybrid/electric) |
| `delek_nm`                                              | Fuel                                            |
| `mishkal_kolel`                                         | Gross weight (kg)                               |
| `mispar_dlatot`, `mispar_moshavim`                      | Doors, seats                                    |
| `kosher_grira_im_blamim` / `_bli_blamim`                | Towing capacity braked / unbraked (kg)          |
| `mispar_kariot_avir`                                    | Number of airbags                               |
| `abs_ind`, `bakarat_yatzivut_ind`                       | ABS, stability control                          |
| `bakarat_stiya_menativ_ind`                             | Lane departure control                          |
| `nitur_merhak_milfanim_ind`                             | Forward distance monitoring                     |
| `zihuy_holchey_regel_ind`                               | Pedestrian detection                            |
| `bakarat_shyut_adaptivit_ind`                           | Adaptive cruise control                         |
| `zihuy_beshetah_nistar_ind`                             | Blind-spot detection                            |
| `matzlemat_reverse_ind`                                 | Reverse camera                                  |
| `ramat_eivzur_betihuty`, `nikud_betihut`                | Safety equipment level, safety score            |
| `kvutzat_zihum`, `madad_yarok`                          | Pollution group (1–15), green index             |
| `CO2_WLTP`, `NOX_WLTP`, `PM_WLTP`, `CO_WLTP`, `HC_WLTP` | WLTP emissions                                  |
| `sug_tkina_nm`                                          | Homologation standard (e.g. European)           |

```json
{
  "tozeret_cd": 5,
  "tozeret_nm": "צ'אנג יאנג סין",
  "tozeret_eretz_nm": "סין",
  "tozar": "צ'אנג יאנג",
  "degem_cd": 179,
  "sug_degem": "M",
  "shnat_yitzur": 2021,
  "nefah_manoa": 2967,
  "koah_sus": 286,
  "automatic_ind": 1,
  "merkav": "פנאי-שטח",
  "ramat_gimur": "COMFORT",
  "delek_nm": "דיזל",
  "mispar_kariot_avir": 6,
  "abs_ind": 1,
  "technologiat_hanaa_nm": "הנעה רגילה",
  "kvutzat_zihum": 15,
  "nikud_betihut": 4.5,
  "ramat_eivzur_betihuty": 4,
  "CO2_WLTP": 221,
  "kinuy_mishari": "Q8"
}
```

## 9. Fallback registries

Use these when the plate isn't in #1. Query them all in parallel and take the first hit in this priority order: **1 → 9c → 9e → 9a → 9b → 9f → 9d**.

| Dataset                        | Notable fields beyond plate/make/model/year/fuel                                                                                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9a Motorcycle                  | `tozeret_eretz_nm`, `nefach_manoa` (cc), `hespek` (power, kW), `sug_rechev_nm`, `baalut`, `mkoriut_nm`, `moed_aliya_lakvish`; **no** test or license dates |
| 9b Heavy (>3.5 t)              | `mishkal_kolel`, `mishkal_azmi`, `kvutzat_sug_rechev`, `hanaa_nm`, `grira_nm`, `sranim`; **no** test, license, or color                                    |
| 9c Inactive with model code    | identical to #1, including `mivchan_acharon_dt` and `tokef_dt` (these will be expired)                                                                     |
| 9d Inactive without model code | like 9b                                                                                                                                                    |
| 9e Personal import             | `sug_yevu`, `mivchan_acharon_dt`, `tokef_dt`, `sug_rechev_nm`                                                                                              |
| 9f Public vehicles             | `sug_rechev_nm`, `bitul_nm`, `bitul_dt`, `tokef_dt`, `mispar_mekomot`                                                                                      |

Vehicles from all fallback datasets can be joined to WLTP only when they have `degem_cd` + `sug_degem` (1 and 9c).

---

## Design decisions (agreed 2026-11-05)

- **D1. Stolen flag.** No public source exists, so `flags.stolen` is `boolean | null` and always `null`. It's listed in `sources[]` with status `"unavailable"`, and the UI shows "לא זמין במאגרים הציבוריים".
- **D2. Plate length.** The API accepts **2–8 digits**, because real 2–4 digit plates exist (old or heavy vehicles, e.g. `870`). The UI formats 7- and 8-digit plates.
- **D3. Off-road lookups.** All three resources (5, 5b, 5c) are queried, with an 8-digit zero-padded string for the legacy ones. That makes 14 plate lookups per request, plus up to 2 joins.
- **D4. `sources[].status`** is `ok | empty | error | unavailable`.
- **D5. "Many ownership changes"** is ownership periods minus 1, with dealer periods included. The alert fires at ≥4.
- Resource 1b (registry continuation) is documented here but not used by the app.
