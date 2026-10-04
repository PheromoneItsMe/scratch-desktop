import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://127.0.0.1:8765"

def check_health():
    try:
        req = urllib.request.Request(f"{BASE_URL}/health")
        with urllib.request.urlopen(req, timeout=3) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return {"status": "offline", "error": str(e)}

def get_state():
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/state")
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return {"error": str(e)}

def get_project():
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/project")
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return {"error": str(e)}

def load_project(project_data):
    try:
        payload = json.dumps(project_data).encode('utf-8')
        req = urllib.request.Request(
            f"{BASE_URL}/api/load-project",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return {"error": str(e)}

def capture_screenshot(output_path: str):
    try:
        req = urllib.request.Request(f"{BASE_URL}/api/screenshot")
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = resp.read()
            with open(output_path, "wb") as f:
                f.write(data)
            return {"status": "ok", "saved_to": output_path, "bytes": len(data)}
    except Exception as e:
        return {"error": str(e)}

def open_generator():
    try:
        req = urllib.request.Request(
            f"{BASE_URL}/api/open-generator",
            data=b"{}",
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        cmd = sys.argv[1].lower()
        if cmd == "screenshot":
            out_file = sys.argv[2] if len(sys.argv) > 2 else "screenshot.png"
            res = capture_screenshot(out_file)
            print(json.dumps(res, indent=2, ensure_ascii=False))
        elif cmd == "state":
            print(json.dumps(get_state(), indent=2, ensure_ascii=False))
        elif cmd == "open":
            print(json.dumps(open_generator(), indent=2, ensure_ascii=False))
        else:
            print("Unknown command:", cmd)
    else:
        status = check_health()
        print("Bridge status:", json.dumps(status, indent=2, ensure_ascii=False))
