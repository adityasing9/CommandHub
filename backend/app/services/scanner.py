import subprocess
import shutil

def run_command(args):
    try:
        result = subprocess.run(
            args,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            shell=True,
            timeout=2,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return None

def scan_system():
    tools = {
        "Python": {"cmd": "python --version", "installed": False, "version": ""},
        "Node.js": {"cmd": "node --version", "installed": False, "version": ""},
        "Git": {"cmd": "git --version", "installed": False, "version": ""},
        "Java": {"cmd": "java -version", "installed": False, "version": ""}, # stderr redirected
        "Docker": {"cmd": "docker --version", "installed": False, "version": ""},
        "WSL": {"cmd": "wsl --status", "installed": False, "version": ""},
        "Ollama": {"cmd": "ollama --version", "installed": False, "version": ""},
        "VS Code": {"cmd": "code --version", "installed": False, "version": ""},
        "MySQL": {"cmd": "mysql --version", "installed": False, "version": ""},
    }

    results = {}
    for name, config in tools.items():
        # Quick check if command is in path
        executable = config["cmd"].split()[0]
        has_exec = shutil.which(executable) is not None
        
        if has_exec or name in ["Java", "Python"]: # fallback run check
            out = run_command(config["cmd"])
            if out:
                results[name] = {
                    "installed": True,
                    "version": out.split("\n")[0]
                }
                continue
        
        results[name] = {
            "installed": False,
            "version": "Not Found"
        }
        
    return results
