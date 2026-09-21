r"""Start My-Brew's Blender instance's MCP bridge on a private port.

Copied from `Documents/App/.claude/blender-mcp/start_mcp_PORT.py`; 9877 is
My-Brew's row in that registry. Absolute paths — a relative one resolves against
whatever directory the shell is in, and when it misses, Blender opens an empty
scene and this never runs:

    "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" ^
        "C:\Users\usEr\Documents\App\My-Brew\.dev\blender\mybrew_props.blend" ^
        --python "C:\Users\usEr\Documents\App\My-Brew\.dev\blender\start_mcp_9877.py"

On the FIRST run there is no .blend yet - omit that argument. The room's
props have never had a scene file: every one was built by a script in
`~/.claude/mybrew-model-src/` that calls clear_scene(), exports a GLB and
throws the scene away.

Before the first save, name the scene `My-Brew` and set
`scene.blendermcp_port = 9877`. The port is stored IN the .blend, so a file
saved from a default-port session teaches every later session to squat on
9876.

Why this file exists at all: the addon's auto-start probes the default port
9876, finds whatever Blender is already sitting there, and quietly bails. The
symptom is an addon that looks installed and dead, not a port clash — so every
non-default instance has to be told to take a port of its own.

Two details below are load-bearing. The work is deferred behind a timer because
`context.scene` is not reliable while `--python` is still running, and setting
the port property too early fails silently. The retry loop is there because the
addon is not always registered by the time the timer first fires.

Check what is running: netstat -ano | findstr "987"
"""
import bpy

PORT = 9877  # My-Brew - see Documents/App/.claude/MCP-PORTS.md
_state = {"tries": 0}


def _claim_port():
    """Point every scene at our port. Returns True if it took.

    Fails harmlessly while the addon is still unregistered, because
    `blendermcp_port` is its property and does not exist yet.
    """
    scenes = list(bpy.data.scenes)
    if not scenes:
        return False
    try:
        for scene in scenes:
            scene.blendermcp_port = PORT
    except AttributeError:
        return False
    return True


# SET THE PORT BEFORE THE ADDON GOES LOOKING FOR IT. This is the whole fix.
#
# The addon's auto-start runs on its own timer at 0.5s and reads
# `scene.blendermcp_port`; this script's timer was set to 3.0s, so auto-start
# always got there first and read the default, 9876. Worse, it only LOOKS
# correct: when something else already holds 9876 the auto-start probe bails
# and the late timer gets a clean run, which is why this worked at all while
# another Blender was squatting the default. With 9876 free -- the normal case
# -- Blender silently comes up on the shared port with the panel reporting
# "Connected", which is the exact collision the registry exists to prevent.
#
# Racing it afterwards (stop the server, restart on our port) is not the fix
# either: it leaves a window where we are bound to 9876, and the addon's
# `_user_stopped_server` flag is in the way. Claiming the port up front means
# auto-start does the right thing by itself and there is no race left.
_claimed_at_import = _claim_port()
print(f"BlenderMCP-{PORT}: port claimed at import: {_claimed_at_import}", flush=True)


def _start():
    _state["tries"] += 1
    try:
        _claim_port()

        server = getattr(bpy.types, "blendermcp_server", None)
        running = server is not None and getattr(server, "running", False)

        if running and getattr(server, "port", None) == PORT:
            print(f"BlenderMCP-{PORT}: already running on port {server.port}", flush=True)
            return None

        if running:
            # THE RACE THIS SCRIPT EXISTS FOR, IN ITS OTHER DIRECTION.
            #
            # The template bailed on "a server is already running", which is
            # only the right move when that server is OURS. The addon's
            # auto-start probes the DEFAULT port and bails when it is taken --
            # so when 9876 happens to be FREE, auto-start wins the race, binds
            # it, and this callback then finds a running server and quietly
            # leaves the instance on the default. Silently landing on 9876 is
            # the exact collision the port registry exists to prevent, and
            # nothing reports it: the panel says Connected, just not to us.
            #
            # Safe to stop: this is our own process, started seconds ago by
            # our own --python, so there is no other session behind it.
            print(f"BlenderMCP-{PORT}: auto-start took {server.port}, moving", flush=True)
            bpy.ops.blendermcp.stop_server()

        bpy.ops.blendermcp.start_server()

        server = getattr(bpy.types, "blendermcp_server", None)
        if server is not None and getattr(server, "running", False):
            if server.port != PORT:
                raise RuntimeError(f"started on {server.port}, wanted {PORT}")
            print(f"BlenderMCP-{PORT}: started on port {server.port}", flush=True)
            return None
    except Exception as exc:
        print(f"BlenderMCP-{PORT}: attempt {_state['tries']} failed: {exc}", flush=True)

    if _state["tries"] < 10:
        return 1.0
    print(f"BlenderMCP-{PORT}: giving up after {_state['tries']} attempts", flush=True)
    return None


bpy.app.timers.register(_start, first_interval=3.0)
