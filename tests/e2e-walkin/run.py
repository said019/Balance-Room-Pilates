"""Local Founding test runner: explicitly uses disposable clean environment."""
import json,os,subprocess
from pathlib import Path
front=Path(__file__).resolve().parents[2]
base=front.parents[1]
settings=json.load(open(front.parent/'test-env.json'))
env={k:os.environ[k] for k in ['PATH','HOME','TMPDIR','LANG'] if k in os.environ}|settings
env['NODE_OPTIONS']='--import='+(base/'network-guard.mjs').as_uri()
raise SystemExit(subprocess.call(['node','node_modules/@playwright/test/cli.js','test','--config','playwright.walkin.config.ts'],cwd=front,env=env))
