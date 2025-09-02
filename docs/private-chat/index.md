# Private Chat Documentation

## Overview

This private chat system provides **unprecedented privacy** through complete TEE (Trusted Execution Environment) deployment. Unlike traditional AI chat applications, the entire stack - including frontend, backend, database, and LLM provider - runs within hardware-protected secure enclaves.

## Key Features

### 🔒 Complete TEE Deployment
- **Frontend & Backend**: Run within Phala Network's TEE
- **Database**: Encrypted at rest, inaccessible to developers
- **LLM Provider**: NEAR AI Cloud also operates in TEE environment

### 🛡️ Multi-Sig Governance
- All code updates require multi-signature approval
- Ethereum smart contract authorization prevents unauthorized changes
- Phala's Decentralized Root of Trust (DeRoT) manages keys

### 🔐 Per-User Encryption
- AES-256-GCM encryption for all user data
- External key management through TEE-sealed keys
- Zero-knowledge architecture - even developers cannot access user data

## Architecture

The system consists of two main TEE environments communicating securely:

1. **Phala TEE**: Hosts the chat application, key service, and encrypted database
2. **NEAR AI Cloud TEE**: Provides LLM inference with zero data retention

**Privacy Guarantee**: User conversations never leave TEE environments and cannot be accessed by developers, cloud providers, or even through government subpoenas.

## Documentation

- **[Architecture](./arch.md)** - Complete TEE deployment architecture, multi-sig governance, and system flow
- **[Encryption](./encryption.md)** - Detailed technical implementation of user data encryption and privacy features

## Security Benefits

This architecture protects against:
- Database breaches (data encrypted at rest)
- Developer access (zero-knowledge design)
- Cloud provider surveillance (TEE isolation)
- LLM provider data mining (NEAR AI Cloud TEE)
- Government subpoenas (data inaccessible)
- Supply chain attacks (multi-sig authorization)

The combination of hardware-level security, decentralized governance, and end-to-end encryption creates a paradigm shift in AI chat privacy.