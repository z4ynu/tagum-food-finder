# Snapshot metadata

Large or restricted source snapshots are not stored in Git. Add only small, redistributable fixtures here and document their source and license beside them.

## Overture Places

The Overture snapshot is produced from a pinned public release and remains ignored by Git. Install the pinned extractor dependency, then run:

```powershell
python -m pip install --requirement validation/requirements-overture.txt
python scripts/extract-overture-food-places.py --release 2026-09-23.1
```

The extractor reads only the approved Tagum boundary's bounding box. The TypeScript import builder verifies the output checksum, clips every normalized record to the exact approved polygon, and conservatively classifies records before any staging operation.
