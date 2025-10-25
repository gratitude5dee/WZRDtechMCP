# WZRD.tech MCP Server
## The World's First Fully Autonomous Creative Agency

<p align="center">
  <strong>Built by <a href="https://5deestudios.com">5-Dee Studios</a></strong><br/>
  <em>Powered by x402 • 800+ AI Models • Global Instant Payments</em>
</p>

---

## Overview

**WZRD.tech** is a global autonomous creative agency built on the **x402 protocol** (Agentic Commerce Protocol), delivering end-to-end creative production and commerce capabilities through AI agents. With access to **800+ creative AI models** and **instant global payment settlement**, WZRD.tech enables entirely autonomous creative workflows—from concept to production to market deployment.

### What Makes WZRD.tech Unique

- **🎨 Full-Stack Creative Production** - From initial design concepts to physical product manufacturing
- **🤖 Autonomous Agent Commerce** - AI agents can commission work, pay for services, and execute entire campaigns independently
- **🌍 Global Payment Infrastructure** - Payments settled anywhere in the world, instantly via x402 rails
- **⚡ 800+ AI Models** - Industry's largest model catalog accessible through a single MCP interface
- **🔗 ACP/x402 Compliant** - Aligned to OpenAI & Stripe's Agent Commerce Protocol standards

---

## 🎯 Creative Agency Capabilities

### Creative Asset Creation

**WZRD.tech** provides comprehensive creative production services through autonomous AI workflows:

#### Visual & Product Design
- **Image Generation** - High-fidelity product mockups, marketing visuals, and brand assets
- **Video Generation** - Product demonstrations, promotional videos, and social media content
- **3D Asset Generation** - Photorealistic 3D models for product visualization and prototyping

#### Fashion & Apparel
- **Virtual Try-On** - AI-powered fitting and visualization for apparel products
- **Fashion Tech Packs** - Complete technical specifications for garment manufacturing
- **T-Shirt & Merch Mockups** - Production-ready designs with complete tech pack documentation
- **Direct-to-Manufacturing Pipeline** - Seamless integration from design to production lines

### Autonomous Ad Generation & Deployment

**Agent-to-Agent Generative Media** - Revolutionary approach to advertising where AI agents:
- Create hyperpersonalized ad content based on audience insights
- Deploy and manage ad campaigns across platforms autonomously
- Pay for ad placement and creative services using the x402 payment protocol
- Optimize campaigns in real-time based on performance metrics

---

## 🚀 Autonomous Transaction Capabilities

Through **x402 rails** and **Agent Commerce Protocol (ACP)** compliance, WZRD.tech MCP enables AI agents to execute complete business workflows with **pay-per-use** pricing:

### End-to-End Product Lifecycle Management

1. **Product Design**
   - Autonomous concept generation and iteration
   - Multi-model creative exploration (image, 3D, video)
   - Design validation and optimization

2. **Product Marketing & Ad Deployment**
   - Automated campaign creation and asset generation
   - Cross-platform ad deployment and management
   - Performance tracking and optimization

3. **Product E-Commerce Deployment**
   - Automated storefront creation and product listing
   - Dynamic pricing and inventory management
   - Customer experience optimization

4. **Order Sourcing & Manufacturing**
   - Supplier identification and negotiation (agent-to-agent)
   - Production order placement and tracking
   - Quality control and fulfillment coordination

5. **Product Order Management & Shipping**
   - Order processing and customer communication
   - Logistics coordination and tracking
   - Returns and customer service automation

---

## 🏗️ Technical Architecture

### x402 Protocol (Agentic Commerce Protocol)

WZRD.tech is built on the **x402/ACP standard**, the foundational protocol for how agents transact with the outside world. Released by OpenAI and already in use by **Stripe, Shopify, and OpenAI**, this open-source standard enables:

- **Any LLM Client** to transact with **Any Vendor**
- **Standardized Payment Flows** with delegated checkout and payment tokenization
- **Idempotency & Reliability** with comprehensive error handling
- **Secure Credential Handling** via Payment Service Provider (PSP) abstraction

### Three-Party Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │────────▶│   Merchant   │────────▶│     PSP     │
│ (AI Agent)  │         │ (WZRD.tech)  │         │  (Payment)  │
└─────────────┘         └──────────────┘         └─────────────┘
      │                        │                        │
      │   1. Create Session    │                        │
      │───────────────────────▶│                        │
      │                        │                        │
      │   2. Add Items/Update  │                        │
      │───────────────────────▶│                        │
      │                        │                        │
      │   3. Request Token     │   4. Vault Payment     │
      │────────────────────────┼───────────────────────▶│
      │                        │                        │
      │   5. Return Token      │   6. Return Token      │
      │◀───────────────────────┼───────────────────────│
      │                        │                        │
      │   7. Complete Checkout │   8. Redeem Token      │
      │───────────────────────▶│───────────────────────▶│
      │                        │                        │
      │   9. Confirmation      │  10. Execute Payment   │
      │◀───────────────────────│◀───────────────────────│
```

---

## 📦 Repository Structure

```
├── demo/                          # Reference implementation of x402/ACP
│   ├── mcp-ui-server/            # MCP server with 800+ creative tools
│   ├── merchant/                  # Merchant API (checkout sessions)
│   └── psp/                       # Payment Service Provider
├── chat-client/                   # MCP-UI compatible chat interface
└── examples/                      # Production-ready reference implementations
    └── reference-implementations/
        └── fal-ai-mcp-server/    # Full ACP compliance with 794+ AI models
```

---

## 🎬 Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- OpenAI and/or Anthropic API keys
- Fal AI API key (for creative models)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/gratitude5dee/WZRDtechMCP
   cd WZRDtechMCP
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   This installs all dependencies across all workspaces (demo services + chat client).

3. **Configure API keys for the chat client**
   ```bash
   cd chat-client
   cp .env.example .env
   # Edit .env and add your OPENAI_API_KEY and/or ANTHROPIC_API_KEY
   cd ..
   ```

4. **Start all services**
   ```bash
   npm run dev
   ```
   This will:
   - Start PostgreSQL databases (via Docker)
   - Start the Merchant API (port 4001)
   - Start the PSP API (port 4000)
   - Start the MCP server (port 3112)

5. **Start the chat client** (in a new terminal)
   ```bash
   cd chat-client
   npm run dev
   ```
   Open http://localhost:3000 in your browser.

6. **Experience Autonomous Creative Commerce!**
   - Ask the agent: "Design a t-shirt for my brand"
   - Request product mockups and tech packs
   - Generate marketing materials and ads
   - Complete autonomous checkout with instant payment settlement
   - Watch the Client, Merchant, and PSP interact in real-time via terminal logs

---

## 🎨 Featured: 800+ Creative AI Models

### Fal AI MCP Server - Production-Ready Multi-Model Implementation

The **largest collection of creative AI models** available through a single MCP interface, showcasing full x402/ACP protocol compliance with real-world AI model integration.

**[📂 View Implementation](./examples/reference-implementations/fal-ai-mcp-server/)**

#### Key Features

- ✅ **794+ AI Models** - Complete integration with Fal AI's model catalog
- ✅ **Full x402/ACP Protocol** - Complete compliance with all required headers
- ✅ **Production Ready** - Enterprise-grade error handling, logging, and monitoring
- ✅ **Idempotency** - 24-hour cache with conflict detection per ACP spec
- ✅ **Type Safety** - Complete TypeScript implementation
- ✅ **Well Tested** - Comprehensive test suite with >80% coverage

#### Model Categories

- **Image Generation** - FLUX, Stable Diffusion, DALL-E variants
- **Video Generation** - Runway, Pika, AnimateDiff
- **3D Generation** - TripoSR, Shap-E, Point-E
- **Image-to-Image** - ControlNet, InstantID, IPAdapter
- **Fashion & Virtual Try-On** - Outfit Anyone, Fashion diffusion models
- **Upscaling & Enhancement** - Real-ESRGAN, GFPGAN, CodeFormer
- **Background Removal & Manipulation** - BiRefNet, RMBG

#### What You'll Learn

This reference implementation demonstrates:
- **x402/ACP Header Management** - API-Version: 2025-09-29, Request-Id, Idempotency-Key
- **Flat Error Format** - ACP-compliant error responses (no nested envelopes)
- **Retry Logic** - Exponential backoff with proper error handling
- **Resource Discovery** - MCP resources for model catalog and schemas
- **Dynamic Tool Registration** - 794 models registered as callable tools
- **Caching Strategies** - Multi-layer caching (idempotency, schemas)
- **Production Logging** - Winston-based structured logging

#### Quick Start

```bash
cd examples/reference-implementations/fal-ai-mcp-server
npm install
cp .env.example .env
# Add your FAL_KEY to .env
npm run build

# Get path for Claude Desktop
npm run get-path
```

Then add to your Claude Desktop config:
```json
{
  "mcpServers": {
    "wzrd-tech-fal-ai": {
      "command": "node",
      "args": ["/path/to/fal-ai-mcp-server/build/index.js"],
      "env": {
        "FAL_KEY": "your-fal-api-key"
      }
    }
  }
}
```

**[📚 Full Setup Guide](./examples/reference-implementations/fal-ai-mcp-server/SETUP_GUIDE.md)**

---

## 💼 Use Cases

### For Brands & Marketing Teams
- **Rapid Prototyping** - Generate hundreds of product variations in minutes
- **Campaign Automation** - Deploy hyperpersonalized ad campaigns autonomously
- **Cost Efficiency** - Pay-per-use pricing eliminates agency retainers and minimum commitments

### For E-Commerce Platforms
- **Dynamic Product Generation** - Create unique product listings on-demand
- **Automated Marketing Assets** - Generate product photos, videos, and descriptions at scale
- **Streamlined Manufacturing** - Direct integration from design to production

### For AI Developers
- **Reference Implementation** - Production-grade example of x402/ACP compliance
- **Model Access** - 800+ models through a single, standardized interface
- **Agent Commerce** - Enable your agents to autonomously commission and pay for creative work

---

## 🔒 Security & Compliance

### Payment Security
- **PCI Compliance** - Credential handling delegated to certified PSP
- **Tokenization** - Zero raw payment data exposure to merchants
- **Idempotency** - Guaranteed exactly-once payment processing

### Protocol Standards
- **x402/ACP Compliant** - Full adherence to OpenAI & Stripe standards
- **API Versioning** - Semantic versioning with backward compatibility
- **Error Handling** - Standardized error formats and retry mechanisms

---

## 🛣️ Roadmap

### Phase 1: Foundation (Current)
- ✅ 800+ AI models integrated via Fal AI
- ✅ Full x402/ACP protocol compliance
- ✅ Basic checkout and payment flows
- ✅ Reference implementation and documentation

### Phase 2: Enhanced Creative Workflows (Q1 2025)
- 🔄 Multi-model creative pipelines (e.g., concept → mockup → tech pack → production)
- 🔄 Advanced fashion design capabilities with pattern generation
- 🔄 Automated brand guideline adherence and validation
- 🔄 Real-time collaboration tools for agent-human workflows

### Phase 3: Manufacturing & Fulfillment (Q2 2025)
- 📋 Direct integrations with print-on-demand platforms
- 📋 Manufacturing partner network with automated RFQ/sourcing
- 📋 Quality control and approval workflows
- 📋 End-to-end order tracking and fulfillment

### Phase 4: Marketing Automation (Q2-Q3 2025)
- 📋 Multi-platform ad deployment (Meta, Google, TikTok)
- 📋 A/B testing and campaign optimization
- 📋 Audience segmentation and personalization at scale
- 📋 ROI tracking and attribution modeling

---

## 🤝 Contributing

We welcome contributions from the community! Whether you're:
- Adding new AI model integrations
- Improving protocol compliance
- Building example workflows
- Enhancing documentation

Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙋 Support & Community

- **Documentation**: [Full technical docs](./docs)
- **Issues**: [GitHub Issues](https://github.com/gratitude5dee/WZRDtechMCP/issues)
- **Discussions**: [GitHub Discussions](https://github.com/gratitude5dee/WZRDtechMCP/discussions)

---

## 🌟 About 5-Dee Studios

**5-Dee Studios** is pioneering the future of autonomous creative production. By combining cutting-edge AI models with standardized commerce protocols, we're building the infrastructure for a new era of creative work—where AI agents can autonomously design, produce, market, and deliver products at global scale.

**WZRD.tech** represents our vision: a world where creative ideas can flow seamlessly from concept to customer, mediated by intelligent agents that handle every step of the process with speed, precision, and creativity that exceeds human capabilities.

---

## 📚 Additional Resources

### Protocol Documentation
- [OpenAI Agent Commerce Protocol Docs](https://developers.openai.com/commerce)
- [x402/ACP GitHub Repository](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol)
- [Stripe's ACP Implementation Guide](https://stripe.com/docs/commerce)

### Model Integration Guides
- [Fal AI API Documentation](https://fal.ai/docs)
- [Model Category Reference](./docs/MODEL_CATEGORIES.md)
- [Custom Model Integration Guide](./docs/CUSTOM_MODELS.md)

### Workflow Examples
- [T-Shirt Design to Production](./examples/workflows/tshirt-production.md)
- [Ad Campaign Generation](./examples/workflows/ad-campaign.md)
- [Product Mockup Pipeline](./examples/workflows/product-mockups.md)

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://5deestudios.com">5-Dee Studios</a></strong><br/>
  <em>Empowering the future of autonomous creative commerce</em>
</p>

---

*Note: This repository includes a demo sandbox for development and testing. All transactions in demo mode are mocked—no real payments occur. For production deployments, please contact 5-Dee Studios for enterprise licensing and support.*
