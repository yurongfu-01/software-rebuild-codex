# Software Rebuild Codex

[English](README.md) · MIT · **0.1.0-alpha.1** · 本地执行 · Node.js 22.12+

面向 Codex 的软件理解与独立复刻插件：围绕某个具体功能，收集实现证据、整理功能规格、在你的项目中独立实现，再对照行为验证。采用统一编排与 REA、Reverse-skill、PentAGI 三个独立适配器。

**当前是 alpha。** REA 已完成真实 MCP 握手和工具发现；Reverse-skill 已运行真实三平台路由。PentAGI 当前提供只读 flow API 适配，自动任务启动保持阻断，直到具备可强制执行的隔离、预算及停止控制。桌面、Web、Android 已有作用域、工作流及行为示例，但尚未完成原生 GUI、真实浏览器和 Android 设备的整体验收。

## 使用

```powershell
git clone https://github.com/yurongfu-01/software-rebuild-codex.git
cd software-rebuild-codex
node bin/software-rebuild.mjs doctor
```

本仓库没有 npm 运行时依赖，无须执行 `npm install`。将 `examples/config.example.json` 复制到仓库外，由你维护实际配置；替换示例目录并预先创建允许读写的目录。案例、输出和令牌都应放在仓库外。

```powershell
$env:REBUILD_CONFIG = 'D:\RebuildWork\config.local.json'
node bin/software-rebuild.mjs doctor
node bin/software-rebuild.mjs case_create 'D:\RebuildWork\case.json'
```

案例输入参见 `examples/case.example.json`；授权说明、有效期、目标和读写目录均须符合实际任务。案例不能扩大宿主配置的目录权限；Web 目标必须属于明确列出的 origin。文件路径按真实路径核验，包括 junction 与符号链接。

## 接入 Codex

插件包包含 `.codex-plugin/plugin.json`、`.mcp.json` 和 `skills/software-rebuild/SKILL.md`。可使用客户端支持的本地插件安装方式。当前没有修改你的全局配置，也没有提交 OpenAI 插件目录。

仓库已包含 marketplace，可在支持对应命令的客户端安装：

```powershell
codex plugin marketplace add yurongfu-01/software-rebuild-codex --ref main
codex plugin add software-rebuild-codex@software-rebuild
```

本地测试也可把 marketplace 来源替换为克隆目录的绝对路径。这些命令会安装到所选 Codex 环境；先在启动环境设置 `REBUILD_CONFIG`，再按需刷新或重启客户端。

仅接入 MCP 的备用方式：

```powershell
codex mcp add software_rebuild --env REBUILD_CONFIG=D:/RebuildWork/config.local.json -- node D:/Tools/software-rebuild-codex/bin/software-rebuild.mjs serve
```

该命令会修改对应环境的 Codex MCP 配置，请在你要使用的账号和环境执行。通过客户端安装技能，或在任务中明确引用 `skills/software-rebuild/SKILL.md`；按客户端要求刷新或重启。MCP 协议测试通过不等于现有聊天已加载插件。

## 三个适配器

| 适配器 | 当前行为 | 前提 |
| --- | --- | --- |
| REA | 发现真实工具；按案例绑定的精确参数授权执行 | 单独安装 REA，配置本地命令与参数 |
| Reverse-skill | 调用上游路由脚本，保留路由结果 | 配置可信上游目录及独立工作目录 |
| PentAGI | 通过 HTTPS 读取现有 flow | 你已有的服务、有效证书和环境变量令牌 |

REA 每次工具执行都要匹配宿主配置 `rea.grants` 中的 `caseId`、工具名、完整参数对象及有效期。授权不能由目标文件、上游文字或 MCP 调用参数自行授予。配置启动时读取，改动后重启；先规划多步分析所需的授权。MCP 模式按案例复用 REA 会话，最多八个，空闲 60 秒关闭；关闭后需重新选择目标。CLI 每次启动独立进程，不保留跨命令会话。

Reverse-skill 输出中的命令不会自动执行。未配置上游时只返回明确标注的准备建议，不冒充运行成功。PentAGI 的令牌只从指定环境变量获取；私有 CA 可通过 `caFile` 指定，不能关闭 TLS 校验。读取 flow 不是安全体检，插件没有暴露自动启动渗透任务的工具。

## 工作流与验证

`initialized → scoped → routed → analyzed → specified → rebuilt → verified`。Codex 使用插件技能指导调查和代码编写；插件本身不会凭空生成完整软件。证据需要来源、工具版本、事实/推断分类，并进行哈希校验。规格、实现和验证记录作为分类证据保留。

`verified` 表示操作者提交了非空且全部通过的检查记录，**不是插件独立认证**。请分别报告静态分析、模拟契约、实际运行、独立审查和安全扫描。案例状态不能替代真实验收。

```powershell
npm test
npm run check
npm run demo
```

TLS 测试需要 OpenSSL；Windows 默认寻找 Git for Windows 自带版本，也可设置 `OPENSSL_PATH`。示例需要支持源码运行的 JDK；执行自有 Node、真实本地 HTTP 与 Java 逻辑，每种场景对比五组输入，报告保存在 `.work/demo` 或 `REBUILD_DEMO_ROOT`。Java 逻辑对照不代表 Android 设备运行，本地 HTTP 对照不代表浏览器验证。

详见[验证记录](docs/validation.md)、[上游接口](docs/upstreams.md)、[运行与恢复](docs/operations.md)及英文 README 中的工具表和配置说明。

## 安全与授权边界

宿主配置、上游安装目录和执行程序必须可信。本插件不是恶意原生程序的隔离沙箱；工具执行获得授权后，其所有内部行为不能仅靠目录白名单或提示词约束。分析不可信程序应使用虚拟机、OS 隔离和网络限制。Web origin 校验也不是网络防火墙。

Windows 子进程通过 Job Object 管理；POSIX 使用进程组，恶意脱离进程组不在保证范围。案例根目录属于可信本地存储；能同时改写证据和元数据的本地攻击者不在哈希校验防护范围。

仅处理你拥有或获授权分析的软件，尊重许可、素材和隐私边界。公开仓库只分发插件及自有示例，不包含分析样本、真实案例、上游完整代码或凭据。
