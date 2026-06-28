import subprocess
import threading
import queue
import time

class CommandEngine:
    def __init__(self):
        self.active_processes = {}

    def execute_command(self, command: str, execution_id: str):
        """
        Executes a command and returns a generator that yields output lines.
        """
        # Note: shell=True is used to execute Windows built-in commands (dir, ipconfig, etc.)
        # In a real production app, we need to sanitize `command` strictly or use shell=False 
        # with parsed arguments to prevent arbitrary command injection if inputs are dynamic.
        process = subprocess.Popen(
            command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1, # Line buffered
            creationflags=subprocess.CREATE_NO_WINDOW # Don't open a new console window on Windows
        )
        
        self.active_processes[execution_id] = process

        try:
            for line in iter(process.stdout.readline, ''):
                yield line
        finally:
            process.stdout.close()
            process.wait()
            if execution_id in self.active_processes:
                del self.active_processes[execution_id]

    def terminate_command(self, execution_id: str):
        if execution_id in self.active_processes:
            process = self.active_processes[execution_id]
            process.terminate()
            return True
        return False

# Global instance for the FastAPI app to use
engine = CommandEngine()
