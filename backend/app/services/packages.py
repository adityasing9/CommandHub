import subprocess
import shutil

def is_manager_available(name: str) -> bool:
    return shutil.which(name) is not None

def search_packages(manager: str, query: str):
    if not is_manager_available(manager):
        return {"error": f"Package manager '{manager}' is not installed or not in PATH."}
        
    cmds = {
        "winget": ["winget", "search", query],
        "choco": ["choco", "search", query],
        "scoop": ["scoop", "search", query],
        "npm": ["npm", "search", query, "--json"],
        "pip": ["pip", "search", query], # Note: pip search is often disabled on PyPI index, but check anyway
        "cargo": ["cargo", "search", query, "--limit", "10"],
    }
    
    cmd = cmds.get(manager)
    if not cmd:
        return {"error": "Unsupported package manager."}
        
    try:
        res = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            shell=True,
            timeout=10,
            creationflags=subprocess.CREATE_NO_WINDOW
        )
        return {"output": res.stdout}
    except Exception as e:
        return {"error": str(e)}

def get_install_command(manager: str, pkg: str) -> str:
    templates = {
        "winget": f"winget install {pkg} --silent",
        "choco": f"choco install {pkg} -y",
        "scoop": f"scoop install {pkg}",
        "npm": f"npm install -g {pkg}",
        "pip": f"pip install {pkg}",
        "cargo": f"cargo install {pkg}",
    }
    return templates.get(manager, f"echo 'Unknown manager'")
