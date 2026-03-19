# 第八章：15 个角色的协同作战

## 不是工具集，是虚拟团队

很多人误解 gstack。

他们看到 15 个命令：
- `/office-hours`
- `/plan-ceo-review`  
- `/plan-eng-review`
- `/review`
- `/qa`
- ...

然后想："哦，这是 15 个独立的工具。"

**错了。**

gstack 不是工具集，是**虚拟专家团队**。

每个角色都有明确职责，但更重要的是**它们如何协同工作**。

### 角色全景图

让我先展示完整的角色地图：

#### 思考阶段（战略）

| 角色 | 职责 | 类比 |
|------|------|------|
| `/office-hours` | 产品需求验证 | YC 合伙人 |
| `/plan-ceo-review` | 战略范围决策 | CEO |
| `/plan-eng-review` | 架构可靠性审查 | 工程经理 |
| `/plan-design-review` | 设计一致性审查 | 设计总监 |
| `/design-consultation` | 设计系统构建 | UX 架构师 |

#### 构建阶段（战术）

| 角色 | 职责 | 类比 |
|------|------|------|
| 实现 | 编码实现 | 开发工程师 |
| `/browse` | 浏览器自动化 | QA 工程师 |
| `/setup-browser-cookies` | Cookie 导入 | 运维工程师 |

#### 验证阶段（质量）

| 角色 | 职责 | 类比 |
|------|------|------|
| `/review` | 代码结构性审查 | 资深工程师 |
| `/investigate` | 根因调试 | SRE 工程师 |
| `/design-review` | 视觉审计 | UI 审查员 |
| `/qa` | 系统性测试 | QA 团队 |
| `/qa-only` | 测试报告生成 | QA 报告员 |
| `/codex` | 多 AI 第二意见 | 外部顾问 |

#### 交付阶段（运营）

| 角色 | 职责 | 类比 |
|------|------|------|
| `/ship` | 发布部署 | DevOps 工程师 |
| `/document-release` | 文档自动化 | 技术作家 |
| `/retro` | 每周回顾 | 项目经理 |

#### 安全护栏（保障）

| 角色 | 职责 | 类比 |
|------|------|------|
| `/careful` | 谨慎模式 | 安全官 |
| `/freeze` | 冻结变更 | 变更控制 |
| `/guard` | 保护关键文件 | 安全卫士 |
| `/unfreeze` | 解冻变更 | 变更批准 |

**15 个角色 = 完整的软件公司。**

### 工件驱动的上下文传递

传统团队协作的问题是什么？

**上下文丢失。**

- 产品经理告诉开发者需求
- 开发者忘记细节
- 审查者不知道背景
- QA 不理解业务逻辑
- 运维不知道架构决策

在 gstack 里，这个问题通过**工件驱动**解决。

#### 什么是工件？

工件是**持久化的决策记录**：

```
~/.gstack/projects/{project}/
├── designs/                    # 设计文档
│   ├── {feature}-design.md     # /office-hours 输出
├── ceo-plans/                  # CEO 计划
│   ├── {date}-{feature}.md     # /plan-ceo-review 输出  
├── eng-plans/                  # 工程计划
│   ├── {date}-{feature}.md     # /plan-eng-review 输出
├── qa-reports/                 # QA 报告
│   ├── qa-report-{url}-{date}.md  # /qa 输出
├── ship-reports/               # 发布报告
│   ├── ship-report-{version}.md   # /ship 输出
└── retro-notes/                # 回顾笔记
    ├── retro-{week}.md         # /retro 输出
```

#### 上下文传递流程

让我用一个完整例子说明：

```
Step 1: /office-hours
输入: "我想添加支付功能"
输出: payment-design.md (设计文档)

Step 2: /plan-ceo-review  
输入: 自动读取 payment-design.md
输出: ceo-plan-payment.md (范围决策)

Step 3: /plan-eng-review
输入: 自动读取 payment-design.md + ceo-plan-payment.md  
输出: eng-plan-payment.md (架构计划)

Step 4: 实现
输入: 基于三个文档实现代码

Step 5: /review
输入: 自动读取三个文档 + 代码 diff
输出: 审查发现和修复

Step 6: /qa
输入: 自动分析 git diff，识别受影响页面
输出: qa-report-payment.md + 自动修复

Step 7: /ship
输入: 自动读取所有工件，验证发布就绪
输出: ship-report-v1.0.0.md + 发布
```

**每个角色都知道完整的上下文，不需要重新解释。**

### 并行 Sprint 管理

传统软件开发是串行的：

```
Sprint 1: 需求 → 设计 → 实现 → 测试 → 发布
等待...  
Sprint 2: 需求 → 设计 → 实现 → 测试 → 发布
等待...
Sprint 3: 需求 → 设计 → 实现 → 测试 → 发布
```

为什么？因为**人力资源是瓶颈**。

- 产品经理同时只能做一个需求
- 架构师同时只能做一个设计  
- QA 团队同时只能测一个功能

在 gstack 里，**AI 消除了这个瓶颈**。

#### 并行 Sprint 示例

```
周一早上，启动 5 个并行 Sprint:

Sprint A: /office-hours → 新用户注册流程
Sprint B: /plan-ceo-review → 支付功能战略审查  
Sprint C: /plan-eng-review → API 性能优化架构
Sprint D: /review → 用户管理模块代码审查
Sprint E: /qa → 移动端响应式测试

每个 Sprint 都有完整的虚拟团队在服务。
```

#### 管理并行 Sprint

如何不被淹没？

**审查就绪仪表板**提供全局视图：

```
+====================================================================+
|                    并行 Sprint 仪表板                              |
+====================================================================+
| Sprint          | 状态       | 下一步行动        | 阻塞原因     |
|-----------------|------------|-------------------|-------------|
| 用户注册        | DESIGN     | /plan-ceo-review  | —           |
| 支付功能        | CEO REVIEW | 批准范围          | 等待决策     |
| API 优化        | ENG REVIEW | /review           | —           |
| 用户管理        | CODE REVIEW| 批准修复          | 2 个 CRITICAL|
| 移动端          | QA         | /ship             | 覆盖率不足   |
+--------------------------------------------------------------------+
| 活跃 Sprint: 5/15 | 总进度: 68% | 需要决策: 2      | 阻塞: 2     |
+====================================================================+
```

**你不是在"做工作"，是在"管理工作流"。**

### 实战案例：支付功能的完整生命周期

让我用一个完整案例展示 15 个角色如何协同。

#### Day 1: 产品思考

```
你: /office-hours 我想添加支付功能

/office-hours:
"让我问几个问题...

Q1: 需求证据？
你: 我们有 50 个用户说需要支付功能

Q2: 现状？
你: 用户现在用 PayPal 转账，很麻烦

Q3: 具体用户？
你: Sarah，电商店主，每月处理 100 笔交易

...

生成设计文档: ~/.gstack/projects/myapp/designs/payment-design-20260319.md
```

#### Day 1: 战略审查

```
你: /plan-ceo-review

/plan-ceo-review:
"读取设计文档...

建议模式: SCOPE EXPANSION

10 倍检查:
- 不只是支付，而是完整的商业解决方案
- 包括发票、退款、订阅

范围决策:
✓ Stripe 集成 (M 努力)
✓ PayPal 集成 (S 努力)  
✓ Apple Pay 集成 (S 努力)
✗ 加密货币 (推迟)

生成 CEO 计划: ~/.gstack/projects/myapp/ceo-plans/20260319-payment.md
```

#### Day 2: 架构审查

```
你: /plan-eng-review

/plan-eng-review:
"读取设计文档 + CEO 计划...

错误映射:
- Stripe 超时 → 重试 + 告警
- 并发支付 → 幂等性键
- DB 失败 → 回滚 + 补偿

数据流追踪:
Happy Path: 用户 → 验证 → Stripe → 订单 → 成功
Error Path: Stripe 失败 → 重试 → 用户消息

生成工程计划: ~/.gstack/projects/myapp/eng-plans/20260319-payment.md
```

#### Day 2-3: 实现

```
你: 基于三个文档实现支付功能

提交代码到 feature/payment 分支
```

#### Day 3: 代码审查

```
你: /review

/review:
"读取三个文档 + 代码 diff...

范围检查: CLEAN

结构性缺陷:
1. [CRITICAL] 并发支付竞态条件 → AUTO-FIXED
2. [HIGH] Stripe 异常未处理 → ASK USER

选择修复异常处理...

提交修复: fix(review): handle stripe exceptions
```

#### Day 4: 系统测试

```
你: /qa

/qa:
"检测到 feature/payment 分支...

Diff-aware 测试:
- /checkout 页面
- /orders/confirmation 页面

发现问题:
1. [CRITICAL] 移动端表单布局错乱 → AUTO-FIXED
2. [HIGH] 控制台 Stripe 警告 → AUTO-FIXED

生成回归测试:
- test/integration/checkout_mobile_test.rb
- test/javascript/stripe_cleanup_test.js

健康分数: 72 → 94
```

#### Day 4: 发布准备

```
你: /ship

/shipping:
"审查就绪仪表板:
- Eng Review: CLEAR ✓
- CEO Review: CLEAR ✓
- QA: CLEAR ✓  
- 测试覆盖: 85% ✓
- 文档: 需要更新 ✗

运行 /document-release 自动更新文档...

版本建议: v1.3.0 (次要版本)

确认发布?"
```

#### Day 4: 发布

```
你: 确认发布

/shipping:
"执行发布...

1. 最终测试 ✓
2. 构建生产版本 ✓
3. 更新文档 ✓
4. 推送 GitHub ✓
5. Vercel 部署 ✓
6. 发布后验证 ✓

成功发布 v1.3.0!
URL: https://myapp.vercel.app
```

#### Day 5: 回顾

```
你: /retro

/retro:
"分析过去一周...

完成的 Sprint:
- 支付功能 (5 天)
- 用户注册优化 (3 天)
- API 性能改进 (2 天)

关键洞察:
- /office-hours 的重新定位节省了 2 周开发时间
- /qa 的自动修复避免了 3 个生产 bug
- 并行管理 3 个 Sprint 效率提升 200%

下周重点:
- 继续支付功能的订阅支持
- 开始移动端重构
- 优化 CI/CD 流程

保存回顾: ~/.gstack/projects/myapp/retro-notes/retro-2026-w12.md
```

### 协同的关键原则

基于我的经验，成功的协同依赖几个关键原则：

#### 1. 工件优先

**永远先创建工件，再开始工作。**

- 不要直接编码，先运行 `/office-hours`
- 不要直接审查，先确保有设计文档
- 不要直接测试，先确保有测试计划

工件是协同的基础。

#### 2. 上下文继承

**每个角色都读取之前的工件。**

- `/plan-ceo-review` 读取设计文档
- `/plan-eng-review` 读取设计 + CEO 计划
- `/review` 读取所有三个文档 + 代码

这确保决策一致性。

#### 3. 门禁控制

**不要跳过必需的审查。**

审查就绪仪表板不是建议，是要求。

只有所有必需项通过，才能进入下一步。

#### 4. 并行管理

**同时管理多个 Sprint，但专注决策。**

你不需要同时做所有工作，只需要在关键时刻做决策。

让 AI 处理执行，你处理判断。

### 常见协同反模式

让我分享一些常见的错误：

#### 反模式 1: 跳过早期角色

"这个很简单，直接编码吧。"

**后果：**
- 构建了错误的功能
- 忽略了重要的边界情况
- 后期返工成本更高

**正确做法：**
即使简单功能，也运行 `/office-hours` 和 `/plan-ceo-review`。

#### 反模式 2: 孤立使用角色

只用 `/review`，不用其他角色。

**后果：**
- 审查缺乏上下文
- 发现的问题不够深入
- 修复可能违背原始意图

**正确做法：**
确保完整的工件链存在。

#### 反模式 3: 忽略工件维护

让工件过时或删除。

**后果：**
- 后续角色失去上下文
- 决策历史丢失
- 团队协作困难

**正确做法：**
工件是永久记录，不要删除。

#### 反模式 4: 串行思维

一次只做一个 Sprint。

**后果：**
- 利用率低下
- 交付速度慢
- AI 能力浪费

**正确做法：**
同时启动多个 Sprint，让 AI 并行工作。

### 我的建议：如何最大化协同价值

#### 建议 1：建立标准工作流

为你的团队定义标准的 gstack 工作流：

```
新功能:
1. /office-hours → 设计文档
2. /plan-ceo-review → 范围决策  
3. /plan-eng-review → 架构计划
4. 实现
5. /review → 代码审查
6. /qa → 系统测试
7. /ship → 发布

Bug 修复:
1. /investigate → 根因分析
2. /plan-eng-review → 修复计划  
3. 实现
4. /review → 代码审查
5. /qa → 回归测试
6. /ship → 发布
```

#### 建议 2：使用审查就绪仪表板

每天早上查看仪表板：

- 哪些 Sprint 需要决策？
- 哪些 Sprint 被阻塞？
- 哪些 Sprint 可以推进？

这让你高效管理工作流。

#### 建议 3：定期运行/retro

每周运行 `/retro`：

- 分析 Sprint 完成情况
- 识别流程改进点
- 调整下周计划

持续改进是关键。

#### 建议 4：培训团队理解协同

确保团队理解：

- 每个角色的职责
- 工件的重要性
- 并行管理的方法

协同不是自动的，需要理解和实践。

### 结语：一人公司的崛起

gstack 证明了一个惊人的事实：

**一个人可以拥有完整的软件公司能力。**

不是通过成为超人，而是通过**智能的协同系统**。

15 个角色不是 15 个工具，是 15 个编码的专家决策模式。

它们协同工作，形成一个**虚拟的、高效的、可靠的软件生产团队**。

在 AI 时代，**协调的价值远超执行**。

因为执行的边际成本趋近于零，而协调确保执行的方向正确。

所以，学会协调。

运行完整的 gstack 工作流。

---

**下一章：AI 时代的组织设计**

我们会讲解：
- 从"人际协调"到"人机协调"
- 一人公司的崛起
- 管理者的新角色
- 未来的工作
