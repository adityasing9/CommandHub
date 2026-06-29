from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import subprocess
import uvicorn
import datetime

from app.db import models, database
from app.api import schemas
from app.plugins import manager

# Create tables
models.Base.metadata.create_all(bind=database.engine)

# Load plugins
loaded_plugins = manager.manager.discover_and_load()

app = FastAPI(title="CommandHub Local API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── ROOT ────────────────────────────────────────────
@app.get("/")
def read_root():
    return {"status": "ok", "version": "1.0.0", "message": "CommandHub Local API is running"}

# ─── COMMANDS ────────────────────────────────────────
@app.get("/api/commands", response_model=List[schemas.CommandResponse])
def get_commands(q: Optional[str] = Query(None), category: Optional[str] = Query(None), db: Session = Depends(get_db)):
    query = db.query(models.Command)
    if q:
        s = f"%{q}%"
        query = query.filter(
            models.Command.title.ilike(s) |
            models.Command.tags.ilike(s) |
            models.Command.description.ilike(s)
        )
    if category:
        query = query.join(models.Category).filter(models.Category.name.ilike(category))
    db_commands = query.all()
    plugin_commands = manager.manager.get_plugin_commands()
    plugin_objs = []
    for idx, pc in enumerate(plugin_commands):
        plugin_objs.append(schemas.CommandResponse(
            id=9000 + idx,
            title=pc.get("title", "Plugin Command"),
            description=pc.get("description", ""),
            syntax=pc.get("syntax", ""),
            tags=pc.get("tags", ""),
            risk_level=pc.get("risk_level", "green"),
            created_at=datetime.datetime.utcnow(),
            updated_at=datetime.datetime.utcnow(),
            category=schemas.CategoryResponse(id=999, name="Plugins", icon="🧩")
        ))
    return db_commands + plugin_objs

@app.get("/api/commands/{command_id}", response_model=schemas.CommandResponse)
def get_command(command_id: int, db: Session = Depends(get_db)):
    cmd = db.query(models.Command).filter(models.Command.id == command_id).first()
    if not cmd:
        raise HTTPException(status_code=404, detail="Command not found")
    return cmd

@app.post("/api/commands", response_model=schemas.CommandResponse)
def create_command(cmd: schemas.CommandBase, db: Session = Depends(get_db)):
    db_cmd = models.Command(**cmd.model_dump())
    db.add(db_cmd)
    db.commit()
    db.refresh(db_cmd)
    return db_cmd

# ─── CATEGORIES ──────────────────────────────────────
@app.get("/api/categories", response_model=List[schemas.CategoryResponse])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()

# ─── EXECUTE ─────────────────────────────────────────
@app.post("/api/execute")
def execute_command(req: schemas.ExecuteRequest, db: Session = Depends(get_db)):
    """Execute a command and stream output line by line."""
    def stream_output():
        try:
            if req.shell_type == "powershell":
                full_cmd = ["powershell", "-NoProfile", "-Command", req.command]
            else:
                full_cmd = req.command
                
            proc = subprocess.Popen(
                full_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True,
                shell=(req.shell_type == "cmd"),
                creationflags=subprocess.CREATE_NO_WINDOW
            )
            output_lines = []
            for line in iter(proc.stdout.readline, ""):
                output_lines.append(line)
                yield line
            proc.wait()
            exit_code = proc.returncode
            full_output = "".join(output_lines)

            # Save to history
            history = models.History(
                raw_command=req.command,
                exit_code=exit_code,
                output=full_output[:5000]
            )
            db.add(history)
            db.commit()
            yield f"\n[Exit Code: {exit_code}]"
        except Exception as e:
            yield f"[ERROR] {str(e)}"

    return StreamingResponse(stream_output(), media_type="text/plain")

# ─── FAVORITES ───────────────────────────────────────
@app.get("/api/favorites", response_model=List[schemas.FavoriteResponse])
def get_favorites(db: Session = Depends(get_db)):
    return db.query(models.Favorite).all()

@app.post("/api/favorites/{command_id}", response_model=schemas.FavoriteResponse)
def add_favorite(command_id: int, db: Session = Depends(get_db)):
    existing = db.query(models.Favorite).filter(models.Favorite.command_id == command_id).first()
    if existing:
        return existing
    fav = models.Favorite(command_id=command_id)
    db.add(fav)
    db.commit()
    db.refresh(fav)
    return fav

@app.delete("/api/favorites/{command_id}")
def remove_favorite(command_id: int, db: Session = Depends(get_db)):
    fav = db.query(models.Favorite).filter(models.Favorite.command_id == command_id).first()
    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")
    db.delete(fav)
    db.commit()
    return {"message": "Removed from favorites"}

# ─── HISTORY ─────────────────────────────────────────
@app.get("/api/history", response_model=List[schemas.HistoryResponse])
def get_history(db: Session = Depends(get_db)):
    return db.query(models.History).order_by(models.History.executed_at.desc()).limit(100).all()

@app.delete("/api/history")
def clear_history(db: Session = Depends(get_db)):
    db.query(models.History).delete()
    db.commit()
    return {"message": "History cleared"}

# ─── SETTINGS ────────────────────────────────────────
@app.get("/api/settings", response_model=List[schemas.SettingResponse])
def get_settings(db: Session = Depends(get_db)):
    return db.query(models.Setting).all()

@app.post("/api/settings/{key}", response_model=schemas.SettingResponse)
def set_setting(key: str, update: schemas.SettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(models.Setting).filter(models.Setting.key == key).first()
    if setting:
        setting.value = update.value
    else:
        setting = models.Setting(key=key, value=update.value)
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting

# ─── PLUGINS ─────────────────────────────────────────
@app.get("/api/plugins")
def get_plugins():
    return {"loaded": list(manager.manager.loaded_plugins.keys()), "count": len(manager.manager.loaded_plugins)}

# ─── AI ──────────────────────────────────────────────
from app.core import ai

@app.post("/api/ai/explain", response_model=schemas.AIExplainResponseSchema)
def explain_command_endpoint(request: schemas.AIExplainRequest):
    return ai.explain_command(request.command_syntax)

@app.get("/api/ai/search", response_model=List[schemas.CommandResponse])
def search_commands_ai(q: str = Query(...), db: Session = Depends(get_db)):
    commands = db.query(models.Command).all()
    available = [{"id": c.id, "title": c.title, "description": c.description} for c in commands]
    matched_ids = ai.natural_language_search(q, available)
    if matched_ids:
        if isinstance(matched_ids, dict):
            matched_ids = list(matched_ids.values())[0]
        return db.query(models.Command).filter(models.Command.id.in_(matched_ids)).all()
    return []

# ─── SEED ────────────────────────────────────────────
@app.post("/api/seed")
def seed_database(db: Session = Depends(get_db)):
    if db.query(models.Category).first():
        return {"message": "Database already seeded"}

    # Categories
    cats = {
        "Windows": models.Category(name="Windows", icon="❖", description="Windows OS commands"),
        "Network": models.Category(name="Network", icon="🌐", description="Networking and internet commands"),
        "Git": models.Category(name="Git", icon="📦", description="Git version control commands"),
        "Docker": models.Category(name="Docker", icon="🐳", description="Docker container commands"),
        "PowerShell": models.Category(name="PowerShell", icon="💙", description="PowerShell scripting"),
        "Python": models.Category(name="Python", icon="🐍", description="Python development commands"),
        "Node.js": models.Category(name="Node.js", icon="🟢", description="Node.js and npm commands"),
        "Security": models.Category(name="Security", icon="🔒", description="Security and firewall commands"),
    }
    for c in cats.values():
        db.add(c)
    db.commit()

    commands = [
        # ── Windows ──
        models.Command(title="Flush DNS", description="Clears the DNS resolver cache to fix internet issues.", category_id=cats["Network"].id, tags="dns,flush,internet,slow,network", syntax="ipconfig /flushdns", risk_level="green"),
        models.Command(title="Restart Explorer", description="Kills and restarts Windows Explorer (fixes taskbar/desktop freezes).", category_id=cats["Windows"].id, tags="explorer,restart,freeze,taskbar,desktop", syntax="taskkill /f /im explorer.exe && start explorer.exe", risk_level="yellow"),
        models.Command(title="List Running Processes", description="Shows all currently running processes.", category_id=cats["Windows"].id, tags="processes,task,list,running", syntax="tasklist", risk_level="green"),
        models.Command(title="Kill Process by Name", description="Force-terminates a process by executable name.", category_id=cats["Windows"].id, tags="kill,process,task,stop", syntax="taskkill /f /im <process.exe>", risk_level="yellow"),
        models.Command(title="System Information", description="Displays detailed hardware and OS information.", category_id=cats["Windows"].id, tags="info,system,specs,hardware,os", syntax="systeminfo", risk_level="green"),
        models.Command(title="Check Disk Health", description="Scans the disk for errors and attempts repairs.", category_id=cats["Windows"].id, tags="disk,health,check,repair,chkdsk", syntax="chkdsk C: /f /r", risk_level="yellow"),
        models.Command(title="List Startup Programs", description="Shows all programs that run on system startup.", category_id=cats["Windows"].id, tags="startup,programs,boot,autorun", syntax="wmic startup list brief", risk_level="green"),
        models.Command(title="Clear Temp Files", description="Deletes all temporary files to free up disk space.", category_id=cats["Windows"].id, tags="temp,clean,storage,space,junk", syntax="del /q /f /s %TEMP%\\*", risk_level="yellow"),
        models.Command(title="Show Environment Variables", description="Lists all environment variables in the current session.", category_id=cats["Windows"].id, tags="env,environment,variables,path", syntax="set", risk_level="green"),
        models.Command(title="Create Directory", description="Creates a new folder at the specified path.", category_id=cats["Windows"].id, tags="folder,directory,create,mkdir,new", syntax="mkdir <folder_name>", risk_level="green"),
        models.Command(title="List Directory Contents", description="Lists all files and folders in the current directory.", category_id=cats["Windows"].id, tags="list,directory,files,ls,dir", syntax="dir", risk_level="green"),
        models.Command(title="Shutdown PC", description="Immediately shuts down the computer.", category_id=cats["Windows"].id, tags="shutdown,power,off,turn off", syntax="shutdown /s /t 0", risk_level="red"),
        models.Command(title="Restart PC", description="Immediately restarts the computer.", category_id=cats["Windows"].id, tags="restart,reboot,power", syntax="shutdown /r /t 0", risk_level="red"),
        models.Command(title="Open Task Manager", description="Opens the Windows Task Manager.", category_id=cats["Windows"].id, tags="task,manager,processes,performance", syntax="taskmgr", risk_level="green"),

        # ── Network ──
        models.Command(title="Show IP Configuration", description="Displays full IP configuration for all adapters.", category_id=cats["Network"].id, tags="ip,network,config,adapter,address", syntax="ipconfig /all", risk_level="green"),
        models.Command(title="Ping Host", description="Tests network connectivity to a host.", category_id=cats["Network"].id, tags="ping,network,test,connectivity", syntax="ping <host>", risk_level="green"),
        models.Command(title="Traceroute", description="Traces the route packets take to reach a host.", category_id=cats["Network"].id, tags="traceroute,route,network,hops,tracert", syntax="tracert <host>", risk_level="green"),
        models.Command(title="Show Open Ports", description="Lists all active network connections and listening ports.", category_id=cats["Network"].id, tags="ports,network,connections,netstat,open", syntax="netstat -ano", risk_level="green"),
        models.Command(title="Kill Process on Port 3000", description="Terminates whatever process is listening on port 3000.", category_id=cats["Network"].id, tags="port,kill,3000,node,dev server", syntax="for /f \"tokens=5\" %a in ('netstat -ano ^| findstr :3000') do taskkill /PID %a /F", risk_level="yellow"),
        models.Command(title="Reset Winsock", description="Resets the Windows networking stack (Winsock). Fixes many internet connection issues.", category_id=cats["Network"].id, tags="winsock,reset,network,internet,fix", syntax="netsh winsock reset", risk_level="yellow"),
        models.Command(title="Renew IP Address", description="Releases and renews the DHCP IP address.", category_id=cats["Network"].id, tags="ip,renew,dhcp,release,network", syntax="ipconfig /release && ipconfig /renew", risk_level="yellow"),
        models.Command(title="Test DNS Lookup", description="Tests DNS resolution for a hostname.", category_id=cats["Network"].id, tags="dns,test,nslookup,resolve", syntax="nslookup google.com", risk_level="green"),
        models.Command(title="Show WiFi Password", description="Reveals the stored password for a saved WiFi network.", category_id=cats["Network"].id, tags="wifi,password,show,wireless,wlan", syntax="netsh wlan show profile name=\"<WiFi Name>\" key=clear", risk_level="green"),

        # ── Git ──
        models.Command(title="Git Status", description="Shows the working directory status and staged changes.", category_id=cats["Git"].id, tags="git,status,changes,modified", syntax="git status", risk_level="green"),
        models.Command(title="Git Add All", description="Stages all changes in the working directory.", category_id=cats["Git"].id, tags="git,add,stage,all", syntax="git add .", risk_level="green"),
        models.Command(title="Git Commit", description="Commits staged changes with a message.", category_id=cats["Git"].id, tags="git,commit,save,snapshot", syntax="git commit -m \"<message>\"", risk_level="green"),
        models.Command(title="Git Push", description="Pushes committed changes to the remote repository.", category_id=cats["Git"].id, tags="git,push,remote,upload", syntax="git push", risk_level="green"),
        models.Command(title="Git Pull", description="Fetches and merges changes from the remote repository.", category_id=cats["Git"].id, tags="git,pull,sync,fetch,merge", syntax="git pull", risk_level="green"),
        models.Command(title="Git Log (Last 10)", description="Shows the last 10 commits in a compact format.", category_id=cats["Git"].id, tags="git,log,history,commits,oneline", syntax="git log --oneline -10", risk_level="green"),
        models.Command(title="Git Clone", description="Clones a remote repository to the local machine.", category_id=cats["Git"].id, tags="git,clone,download,repository", syntax="git clone <url>", risk_level="green"),
        models.Command(title="Delete Git Branch", description="Deletes a local git branch.", category_id=cats["Git"].id, tags="git,branch,delete,remove", syntax="git branch -d <branch_name>", risk_level="yellow"),
        models.Command(title="Hard Reset Last Commit", description="Undoes the last commit and discards all changes. IRREVERSIBLE.", category_id=cats["Git"].id, tags="git,reset,undo,hard,rollback", syntax="git reset --hard HEAD~1", risk_level="red"),
        models.Command(title="Create & Switch Branch", description="Creates a new branch and switches to it.", category_id=cats["Git"].id, tags="git,branch,create,switch,checkout", syntax="git checkout -b <branch_name>", risk_level="green"),

        # ── Docker ──
        models.Command(title="List Running Containers", description="Shows all currently running Docker containers.", category_id=cats["Docker"].id, tags="docker,containers,list,running,ps", syntax="docker ps", risk_level="green"),
        models.Command(title="List All Containers", description="Shows all containers including stopped ones.", category_id=cats["Docker"].id, tags="docker,containers,list,all,stopped", syntax="docker ps -a", risk_level="green"),
        models.Command(title="Stop All Containers", description="Stops all running Docker containers.", category_id=cats["Docker"].id, tags="docker,stop,containers,all", syntax="docker stop $(docker ps -q)", risk_level="yellow"),
        models.Command(title="Remove All Containers", description="Removes all stopped Docker containers.", category_id=cats["Docker"].id, tags="docker,remove,clean,containers,prune", syntax="docker container prune -f", risk_level="red"),
        models.Command(title="Pull Docker Image", description="Downloads a Docker image from Docker Hub.", category_id=cats["Docker"].id, tags="docker,pull,image,download", syntax="docker pull <image_name>", risk_level="green"),
        models.Command(title="Build Docker Image", description="Builds a Docker image from a Dockerfile in the current directory.", category_id=cats["Docker"].id, tags="docker,build,image,dockerfile", syntax="docker build -t <name> .", risk_level="green"),
        models.Command(title="View Container Logs", description="Shows the output logs of a running container.", category_id=cats["Docker"].id, tags="docker,logs,debug,output,container", syntax="docker logs <container_id>", risk_level="green"),
        models.Command(title="Docker System Prune", description="Removes all unused containers, networks, images. FREES DISK SPACE.", category_id=cats["Docker"].id, tags="docker,prune,clean,disk,space", syntax="docker system prune -af", risk_level="red"),

        # ── PowerShell ──
        models.Command(title="Get All Services", description="Lists all Windows services and their status.", category_id=cats["PowerShell"].id, tags="powershell,services,list,windows", syntax="Get-Service", risk_level="green"),
        models.Command(title="Set Execution Policy", description="Allows running PowerShell scripts by setting the execution policy.", category_id=cats["PowerShell"].id, tags="powershell,policy,security,execution,scripts", syntax="Set-ExecutionPolicy RemoteSigned -Scope CurrentUser", risk_level="yellow"),
        models.Command(title="Get System Uptime", description="Shows how long the system has been running.", category_id=cats["PowerShell"].id, tags="powershell,uptime,system,boot,time", syntax="(Get-Date) - (gcim Win32_OperatingSystem).LastBootUpTime", risk_level="green"),
        models.Command(title="Get Disk Usage", description="Shows disk space usage for all drives.", category_id=cats["PowerShell"].id, tags="powershell,disk,space,storage,drives", syntax="Get-PSDrive -PSProvider FileSystem", risk_level="green"),
        models.Command(title="Find Large Files", description="Finds the 20 largest files on the C drive.", category_id=cats["PowerShell"].id, tags="powershell,files,large,storage,find", syntax="Get-ChildItem C:\\ -Recurse -ErrorAction SilentlyContinue | Sort-Object Length -Descending | Select-Object -First 20 FullName, Length", risk_level="green"),

        # ── Python ──
        models.Command(title="Run Python Script", description="Executes a Python script file.", category_id=cats["Python"].id, tags="python,run,script,execute", syntax="python script.py", risk_level="green"),
        models.Command(title="Install Package (pip)", description="Installs a Python package from PyPI.", category_id=cats["Python"].id, tags="python,pip,install,package,pypi", syntax="pip install <package_name>", risk_level="green"),
        models.Command(title="List Installed Packages", description="Lists all installed Python packages.", category_id=cats["Python"].id, tags="python,pip,packages,list,installed", syntax="pip list", risk_level="green"),
        models.Command(title="Create Virtual Environment", description="Creates a Python virtual environment.", category_id=cats["Python"].id, tags="python,venv,virtual,environment,create", syntax="python -m venv venv", risk_level="green"),
        models.Command(title="Activate Virtual Environment", description="Activates a Python virtual environment on Windows.", category_id=cats["Python"].id, tags="python,venv,activate,virtual,environment", syntax=".\\venv\\Scripts\\Activate.ps1", risk_level="green"),

        # ── Node.js ──
        models.Command(title="Install npm Dependencies", description="Installs all packages listed in package.json.", category_id=cats["Node.js"].id, tags="node,npm,install,dependencies,packages", syntax="npm install", risk_level="green"),
        models.Command(title="Run Dev Server", description="Starts the development server defined in package.json.", category_id=cats["Node.js"].id, tags="node,npm,dev,server,run,start", syntax="npm run dev", risk_level="green"),
        models.Command(title="List Global npm Packages", description="Shows all globally installed npm packages.", category_id=cats["Node.js"].id, tags="node,npm,global,packages,list", syntax="npm list -g --depth=0", risk_level="green"),
        models.Command(title="Update All npm Packages", description="Updates all packages in the project to their latest versions.", category_id=cats["Node.js"].id, tags="node,npm,update,upgrade,packages", syntax="npm update", risk_level="yellow"),
        models.Command(title="Clear npm Cache", description="Clears the npm package cache.", category_id=cats["Node.js"].id, tags="node,npm,cache,clear,clean", syntax="npm cache clean --force", risk_level="yellow"),

        # ── Security ──
        models.Command(title="Show Firewall Rules", description="Lists all active Windows Firewall rules.", category_id=cats["Security"].id, tags="firewall,security,rules,ports,policy", syntax="netsh advfirewall firewall show rule name=all", risk_level="green"),
        models.Command(title="Enable Windows Firewall", description="Enables the Windows Firewall for all network profiles.", category_id=cats["Security"].id, tags="firewall,enable,security,protection,on", syntax="netsh advfirewall set allprofiles state on", risk_level="yellow"),
        models.Command(title="Disable Windows Firewall", description="Disables the Windows Firewall. USE WITH CAUTION.", category_id=cats["Security"].id, tags="firewall,disable,security,off,danger", syntax="netsh advfirewall set allprofiles state off", risk_level="red"),
        models.Command(title="Check for Active Admin Sessions", description="Lists currently logged-on users and sessions.", category_id=cats["Security"].id, tags="security,users,sessions,admin,logon", syntax="query user", risk_level="green"),
    ]

    for cmd in commands:
        db.add(cmd)
    db.commit()
    return {"message": f"Seeded {len(cats)} categories and {len(commands)} commands successfully!"}

@app.post("/api/seed/reset")
def reset_and_reseed(db: Session = Depends(get_db)):
    """Clears and reseeds the database."""
    db.query(models.Favorite).delete()
    db.query(models.History).delete()
    db.query(models.Command).delete()
    db.query(models.Category).delete()
    db.commit()
    return seed_database(db)

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)
