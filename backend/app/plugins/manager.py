import os
import importlib.util
from typing import List, Dict

class PluginManager:
    def __init__(self, plugins_dir: str):
        self.plugins_dir = plugins_dir
        self.loaded_plugins: Dict[str, any] = {}

    def discover_and_load(self) -> List[str]:
        """
        Scans the plugins directory and dynamically loads any python modules found.
        Returns a list of loaded plugin names.
        """
        if not os.path.exists(self.plugins_dir):
            os.makedirs(self.plugins_dir)
            return []

        loaded = []
        for filename in os.listdir(self.plugins_dir):
            if filename.endswith(".py") and not filename.startswith("__"):
                plugin_name = filename[:-3]
                path = os.path.join(self.plugins_dir, filename)
                
                try:
                    spec = importlib.util.spec_from_file_location(plugin_name, path)
                    module = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(module)
                    
                    self.loaded_plugins[plugin_name] = module
                    loaded.append(plugin_name)
                    
                    # Call an initialize() function if the plugin provides one
                    if hasattr(module, 'initialize'):
                        module.initialize()
                        
                except Exception as e:
                    print(f"Error loading plugin {plugin_name}: {e}")
                    
        return loaded

    def get_plugin_commands(self) -> List[dict]:
        """
        Collects custom commands exposed by plugins.
        """
        commands = []
        for name, module in self.loaded_plugins.items():
            if hasattr(module, 'export_commands'):
                cmds = module.export_commands()
                for c in cmds:
                    c['plugin_source'] = name
                    commands.append(c)
        return commands

# Global instance
manager = PluginManager(os.path.join(os.path.dirname(__file__), "..", "..", "..", "plugins"))
