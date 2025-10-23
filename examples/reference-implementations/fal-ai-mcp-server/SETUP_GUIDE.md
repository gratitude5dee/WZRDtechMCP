# Fal AI MCP Server - Complete Setup Guide

This guide will walk you through setting up the Fal AI MCP Server from scratch.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Get a Fal AI API Key](#get-a-fal-ai-api-key)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Claude Desktop Integration](#claude-desktop-integration)
6. [Verification](#verification)
7. [Advanced Configuration](#advanced-configuration)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: macOS, Linux, or Windows with WSL
- **Node.js**: Version 20.0.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Memory**: At least 512MB RAM available
- **Disk Space**: ~100MB for dependencies and build

### Check Your Environment

```bash
# Check Node.js version
node --version
# Should output: v20.x.x or higher

# Check npm version
npm --version
# Should output: 9.x.x or higher
```

If you need to install or update Node.js, visit [nodejs.org](https://nodejs.org/).

## Get a Fal AI API Key

1. **Sign up for Fal AI**
   - Visit [fal.ai](https://fal.ai/)
   - Click "Sign Up" or "Get Started"
   - Create an account using email or GitHub

2. **Access Your Dashboard**
   - After logging in, navigate to the [Dashboard](https://fal.ai/dashboard)
   - Click on "Keys" or "API Keys" in the sidebar

3. **Create an API Key**
   - Click "Create New Key"
   - Give it a name (e.g., "MCP Server")
   - Copy the key immediately (it won't be shown again)
   - Store it securely

4. **Add Credits (if needed)**
   - Most Fal AI models require credits
   - Navigate to "Billing" in your dashboard
   - Add credits to your account

## Installation

### Step 1: Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/agentic-commerce-protocol/agentic-commerce-protocol.git

# Navigate to the Fal AI MCP server directory
cd agentic-commerce-protocol/examples/reference-implementations/fal-ai-mcp-server
```

### Step 2: Install Dependencies

```bash
# Install all required packages
npm install
```

This will install:
- MCP SDK
- Fal AI client
- TypeScript and build tools
- Logging utilities
- Testing frameworks

**Note**: Installation may take 2-5 minutes depending on your connection speed.

### Step 3: Build the Project

```bash
# Compile TypeScript to JavaScript
npm run build
```

This creates the `build/` directory with compiled JavaScript files.

Verify the build:
```bash
ls build/
# Should show: index.js and other compiled files
```

## Configuration

### Step 1: Create Environment File

```bash
# Copy the example environment file
cp .env.example .env
```

### Step 2: Edit Environment Variables

Open `.env` in your favorite text editor:

```bash
# Using nano
nano .env

# Or using vim
vim .env

# Or using VS Code
code .env
```

### Step 3: Set Your API Key

Update the `FAL_KEY` variable with your actual API key:

```bash
# Required - Your Fal AI API key
FAL_KEY=your-actual-api-key-here

# Optional - Keep defaults for now
MCP_SERVER_VERSION=2025-09-29
LOG_LEVEL=info
CACHE_TTL_SECONDS=86400
```

**Important**: Never commit your `.env` file to version control!

## Claude Desktop Integration

### Step 1: Locate Configuration File

The Claude Desktop configuration file is located at:

**macOS**:
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

**Linux**:
```bash
~/.config/Claude/claude_desktop_config.json
```

**Windows (WSL)**:
```bash
/mnt/c/Users/[YourUsername]/AppData/Roaming/Claude/claude_desktop_config.json
```

### Step 2: Get the Server Path

Run this command to get the absolute path to your server:

```bash
npm run get-path
```

**Copy the entire output path** - you'll need it in the next step.

Example output:
```
/Users/yourname/agentic-commerce-protocol/examples/reference-implementations/fal-ai-mcp-server/build/index.js
```

### Step 3: Update Claude Desktop Configuration

Create or edit the `claude_desktop_config.json` file:

```bash
# Create the directory if it doesn't exist (macOS)
mkdir -p ~/Library/Application\ Support/Claude

# Edit the configuration file
code ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Add the Fal AI MCP server configuration:

```json
{
  "mcpServers": {
    "fal-ai": {
      "command": "node",
      "args": [
        "/PASTE/YOUR/PATH/HERE/build/index.js"
      ],
      "env": {
        "FAL_KEY": "your-actual-api-key-here"
      }
    }
  }
}
```

**Replace**:
- `/PASTE/YOUR/PATH/HERE/build/index.js` with the path from Step 2
- `your-actual-api-key-here` with your Fal AI API key

**If you already have other MCP servers**, add `fal-ai` to the existing object:

```json
{
  "mcpServers": {
    "existing-server": {
      "command": "...",
      "args": ["..."]
    },
    "fal-ai": {
      "command": "node",
      "args": [
        "/your/path/here/build/index.js"
      ],
      "env": {
        "FAL_KEY": "your-api-key"
      }
    }
  }
}
```

### Step 4: Restart Claude Desktop

1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. The MCP server should start automatically

## Verification

### Step 1: Check Server Logs

Claude Desktop creates log files for each MCP server. Check them:

```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp*.log

# Look for messages like:
# "Fal AI MCP Server initialized"
# "MCP server started successfully"
```

### Step 2: Test with Claude

Open Claude Desktop and try these commands:

**1. List available resources**:
```
What MCP resources are available?
```

You should see:
- `fal://models/catalog`
- `fal://pricing`
- Multiple schema resources

**2. View the model catalog**:
```
Show me the Fal AI model catalog
```

Claude should display information about all 794 models.

**3. Generate an image**:
```
Use the fal_flux_pro tool to generate an image with the prompt: "A peaceful zen garden with cherry blossoms"
```

**4. Check available tools**:
```
What tools are available from the fal-ai server?
```

You should see tools like:
- `fal_flux_pro`
- `fal_luma_dream_machine`
- `fal_stable_diffusion_v3_medium`
- And many more...

### Step 3: Verify Idempotency

Try generating the same image twice:

```
Use fal_flux_pro with prompt "test image"
```

Then immediately:

```
Use fal_flux_pro with the exact same prompt "test image"
```

The second call should be faster (cached).

## Advanced Configuration

### Custom Logging

For detailed debugging:

```bash
# In .env
LOG_LEVEL=debug
ENABLE_FILE_LOGGING=true
LOG_FILE=fal-mcp-debug.log
```

### Performance Tuning

For high-volume usage:

```bash
# Increase cache size and reduce TTL
CACHE_TTL_SECONDS=43200        # 12 hours
SCHEMA_CACHE_TTL_SECONDS=7200  # 2 hours

# Adjust retry behavior
MAX_RETRIES=6
INITIAL_RETRY_DELAY_MS=1000
```

### Development Mode

For development, use:

```bash
# Watch mode - auto-recompiles on changes
npm run watch

# In another terminal, monitor logs
tail -f fal-mcp.log
```

## Troubleshooting

### Issue: "FAL_KEY environment variable is required"

**Symptom**: Server fails to start with this error message.

**Solution**:
1. Verify `.env` file exists in the project root
2. Check that `FAL_KEY=your-key` is set correctly
3. Ensure no spaces around the `=` sign
4. Restart Claude Desktop

### Issue: "Failed to load models data"

**Symptom**: Server starts but reports it can't find model data.

**Solution**:
```bash
# Verify data file exists
ls data/fal_models.json

# If missing, rebuild
npm run clean
npm run build
```

### Issue: "Connection refused" or "ECONNREFUSED"

**Symptom**: Tools fail with connection errors.

**Solution**:
1. Check your internet connection
2. Verify Fal AI is accessible:
   ```bash
   curl https://fal.run/health
   ```
3. Check for firewall/proxy issues
4. Try again with retry enabled (default)

### Issue: Claude Desktop doesn't see the server

**Symptom**: No tools or resources appear in Claude.

**Solution**:
1. Check the config file path is correct:
   ```bash
   cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
   ```
2. Verify the server path is absolute (not relative)
3. Check for JSON syntax errors (use a JSON validator)
4. Look at Claude logs:
   ```bash
   tail -n 50 ~/Library/Logs/Claude/mcp*.log
   ```
5. Restart Claude Desktop completely

### Issue: "Rate limit exceeded"

**Symptom**: Frequent rate limit errors.

**Solution**:
1. Add credits to your Fal AI account
2. Increase retry delay in `.env`:
   ```bash
   INITIAL_RETRY_DELAY_MS=3000
   MAX_RETRIES=5
   ```
3. Space out your requests

### Issue: "Invalid API key" or 401 errors

**Symptom**: Authentication failures.

**Solution**:
1. Verify your API key is correct (no extra spaces)
2. Check if the key is still active in your Fal AI dashboard
3. Generate a new key if needed
4. Update both `.env` AND `claude_desktop_config.json`
5. Restart Claude Desktop

### Getting Help

If you encounter issues not covered here:

1. **Check the logs**:
   ```bash
   tail -f fal-mcp.log
   tail -f fal-mcp-error.log
   ```

2. **Enable debug mode**:
   ```bash
   # In .env
   LOG_LEVEL=debug
   DEBUG=true
   ```

3. **Report an issue**:
   - Visit [GitHub Issues](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol/issues)
   - Include log output (remove API keys!)
   - Describe the steps to reproduce

## Next Steps

Now that your server is set up:

1. **Explore models**: Check out the full catalog at `fal://models/catalog`
2. **Read the docs**: See [README.md](./README.md) for detailed usage
3. **Run tests**: Execute `npm test` to verify everything works
4. **Experiment**: Try different models and parameters
5. **Build**: Create your own AI workflows using Claude + Fal AI

## Security Best Practices

1. **Never commit** your `.env` file or API keys
2. **Use environment variables** in production
3. **Rotate API keys** regularly
4. **Monitor usage** in your Fal AI dashboard
5. **Set spending limits** to avoid surprise charges
6. **Review logs** for suspicious activity

## Updates

To update to the latest version:

```bash
# Pull latest changes
git pull origin main

# Reinstall dependencies
npm install

# Rebuild
npm run build

# Restart Claude Desktop
```

---

**Congratulations!** Your Fal AI MCP Server is now fully set up and ready to use. Happy creating! 🚀
