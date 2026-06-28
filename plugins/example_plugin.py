def initialize():
    print("Example Plugin initialized!")

def export_commands():
    """
    Export custom commands that CommandHub will integrate into its library.
    """
    return [
        {
            "title": "Hello from Plugin",
            "description": "A command injected by the example plugin.",
            "tags": "plugin,example,test",
            "syntax": "echo 'Hello from CommandHub Plugin!'",
            "risk_level": "green"
        }
    ]
