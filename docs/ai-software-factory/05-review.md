# 第五章：/review——偏执的资深工程师如何审查代码

## 为什么通过测试的代码仍会失败

2025 年，有个团队来找我："我们的代码 100% 通过测试，但在生产环境崩溃了。"

我看了他们的代码。测试确实都通过了：
- 单元测试覆盖所有函数
- 集成测试覆盖所有 API
- E2E 测试覆盖所有用户流程

但`/review`发现了问题：

- **N+1 查询**：循环中调用数据库，测试数据只有 3 条记录，生产有 10,000 条
- **竞态条件**：并发请求修改同一记录，测试是串行的
- **信任边界**：直接使用 LLM 输出写入数据库，没有验证
- **枚举完整性**：新增状态值，但 switch 语句没处理所有情况

**这不是"测试不足"，是"测试错了地方"。**

在 gstack 里，`/review`的角色就是找到这些**结构性缺陷**。

### 结构性缺陷 vs 风格问题

传统代码审查关注什么？
- 命名是否清晰
- 函数是否太长
- 注释是否充分
- 代码是否 DRY

这些都是**风格问题**。重要，但不是致命的。

`/review`关注**结构性缺陷**：
- 会让系统在生产环境失败的问题
- 通过测试但实际不可靠的问题
- 在特定条件下才会暴露的问题

**结构性缺陷是沉默的杀手。**

### 八大结构性缺陷类别

`/review`系统化地检查八大类别：

#### 1. SQL 与数据安全

- **N+1 查询**：循环中的数据库查询
- **过时读取**：缓存未失效导致的数据不一致
- **缺失索引**：大数据量下的性能杀手
- **SQL 注入**：动态查询拼接

#### 2. 竞态条件与并发

- **双重提交**：重复点击导致重复操作
- **覆盖写入**：并发修改导致数据丢失
- **死锁**：资源竞争导致系统挂起
- **原子性破坏**：部分成功部分失败

#### 3. LLM 输出信任边界

- **JSON 格式错误**：LLM 返回畸形 JSON
- **幻觉值**：LLM 编造不存在的数据
- **提示注入**：用户输入被当作指令执行
- **类型不匹配**：LLM 返回字符串而非数字

#### 4. 枚举与值完整性

- **新增枚举值**：switch 语句未处理新值
- **状态转换**：非法状态转换未阻止
- **类型常量**：新增类型未在所有地方处理

**关键设计：** 枚举完整性需要读取 diff 外的代码。当 diff 引入新枚举值时，`/review`会 grep 所有引用兄弟值的文件，确保新值被处理。

#### 5. 条件副作用

- **if/else 分支**：某些分支有副作用，某些没有
- **早期返回**：某些路径释放资源，某些不释放
- **异常处理**：某些异常被捕获，某些导致崩溃

#### 6. 魔法数字与字符串耦合

- **硬编码值**：魔法数字、URL、API 端点
- **字符串比较**：字符串常量分散各处
- **配置缺失**：应该可配置的值写死在代码中

#### 7. 死代码与一致性

- **未使用代码**：函数、变量、导入
- **过时注释**：注释与代码不一致
- **重复逻辑**：相同逻辑在多处实现

#### 8. LLM 提示问题

- **提示泄露**：敏感信息在提示中
- **上下文溢出**：提示太长被截断
- **格式要求**：LLM 无法满足的格式要求

### Fix-First 审查：不只是发现问题

`/review`最强大的设计是**Fix-First**（修复优先）。

不是只列出问题，而是**立即修复能修复的**。

#### 自动修复（AUTO-FIX）

对于机械性问题，`/review`直接修复：

```
[AUTO-FIXED] app/models/user.rb:42 — 移除未使用的导入
[AUTO-FIXED] app/services/payment.rb:88 — 添加缺失的数据库索引
[AUTO-FIXED] app/controllers/api/v1/posts_controller.rb:15 — 修复 N+1 查询
```

**规则：** 明确、机械、无歧义的问题自动修复。

#### 询问用户（ASK）

对于需要判断的问题，`/review`询问用户：

```
我自动修复了 5 个问题。2 个需要你的输入：

1. [CRITICAL] app/models/post.rb:42 — 状态转换中的竞态条件
   修复：添加 WHERE status = 'draft' 到 UPDATE
   → A) 修复  B) 跳过

2. [INFORMATIONAL] app/services/generator.rb:88 — LLM 输出未在写入 DB 前验证
   修复：添加 JSON schema 验证
   → A) 修复  B) 跳过

RECOMMENDATION: 修复两者 — #1 是真实竞态条件，#2 防止静默数据损坏。
```

**规则：** 涉及业务逻辑、安全、架构的问题询问用户。

### Greptile 集成：双层审查

`/review`集成了 [Greptile](https://greptile.com) — 一个自动 PR 审查工具。

但这带来新问题：**审查疲劳**。

如果每个 Greptile 评论都要手动处理，开发者会忽略所有评论。

`/review`解决了这个问题：

#### 三步分类

1. **VALID & ACTIONABLE**：真实问题，需要修复
2. **VALID BUT ALREADY FIXED**：真实问题，但已在代码中修复
3. **FALSE POSITIVE**：误报
4. **SUPPRESSED**：已知误报，跳过

#### 自动处理

- **已修复问题**：自动回复 Greptile，确认已修复
- **有效问题**：加入`/review`的发现列表，按 Fix-First 处理
- **误报**：询问用户是否回复 Greptile 解释为什么是误报

**结果：** 双层审查，无审查疲劳。

### 范围漂移检测：构建了什么？

`/review`第一件事是**范围检查**：

```
范围检查：CLEAN / 检测到范围漂移 / 缺失需求
意图：<1 行摘要说明请求了什么>
交付：<1 行摘要说明 diff 实际做了什么>
[如果漂移：列出每个超出范围的变更]
[如果缺失：列出每个未解决的需求]
```

**为什么重要？**

很多 PR 的问题是：**构建了错误的东西**。

- 范围漂移：添加了未请求的功能
- 需求缺失：遗漏了请求的功能

`/review`确保你构建了正确的东西。

### 完整性缺口：Lake vs Ocean

`/review`应用**完整性原则**：

> AI 使完整实现的边际成本趋近于零，因此应始终选择完整方案。

**反模式检测：**

- BAD: "选择 B — 它覆盖 90% 的价值，代码更少"
- BAD: "我们可以跳过边界情况处理以节省时间"
- BAD: "让我们推迟测试覆盖到后续 PR"
- BAD: 仅引用人类团队时间："这需要 2 周"

**好实践：**

- GOOD: "选项 A 是完整实现（150 LOC），选项 B 是 90%（80 LOC）— 选择 A，因为 70 行差异在 CC 中只需几分钟"
- GOOD: "2 周人类 / ~1 小时 CC"

### 文档陈旧检查

`/review`交叉引用 diff 和文档：

- 如果代码变更影响 README.md 描述的功能
- 如果 ARCHITECTURE.md 描述的组件被修改
- 如果 CLAUDE.md 提到的模式被改变

**发现：** "文档可能陈旧：[file] 描述 [feature/component] 但代码在此分支中已更改。考虑运行 `/document-release`。"

### 设计审查（有条件）

如果 diff 触及前端文件，`/review`进行轻量级设计审查：

- **HIGH** 机械 CSS 修复（`outline: none`、`!important`、`font-size < 16px`）→ AUTO-FIX
- **HIGH/MEDIUM** 设计判断需要 → ASK
- **LOW** 意图检测 → "可能 — 视觉验证或运行 `/design-review`"

### Codex 第二意见（可选）

如果 Codex CLI 可用，`/review`提供第二意见：

```
审查完成。想要 OpenAI Codex 的独立第二意见吗？

A) 运行 Codex 代码审查 — 独立 diff 审查，通过/失败门控
B) 运行 Codex 对抗性挑战 — 尝试找到此代码在生产中失败的方式
C) 两者 — 先审查，再对抗性挑战
D) 跳过 — 不需要 Codex 审查
```

**跨模型分析：** 比较 Claude 和 Codex 的发现，显示重叠和独特发现。

### 实战案例：支付系统的审查

让我详细讲讲开头的案例。

#### 初始代码

```ruby
# app/services/payment_service.rb
def process_payment(user_id, amount)
  user = User.find(user_id)
  stripe_charge = Stripe::Charge.create(
    amount: amount,
    currency: 'usd',
    customer: user.stripe_customer_id
  )
  Order.create!(
    user: user,
    amount: amount,
    stripe_charge_id: stripe_charge.id
  )
end
```

测试通过：
- 单元测试：模拟 Stripe 成功
- 集成测试：真实 Stripe 测试账户
- E2E 测试：完整用户流程

#### /review 的发现

```
/review 启动。

范围检查：CLEAN
意图：处理用户支付
交付：调用 Stripe 并创建订单

结构性缺陷：

1. [CRITICAL] SQL 安全 — N+1 查询
   User.find 在循环中调用？测试数据只有 1 用户。

2. [CRITICAL] 竞态条件 — 并发支付
   没有幂等性检查。用户快速点击两次 → 重复收费。

3. [CRITICAL] 信任边界 — Stripe 异常
   Stripe::Charge.create 可能抛异常。未捕获 → 500 错误。

4. [HIGH] 枚举完整性 — 订单状态
   Order.create! 创建状态为 'pending'，但状态机有 'processing', 'completed', 'failed'。

5. [MEDIUM] 死代码 — 未使用变量
   stripe_charge 只用于 ID，可直接使用 stripe_charge.id。

自动修复：
[AUTO-FIXED] app/services/payment_service.rb:12 — 移除未使用变量

需要你的输入：

1. [CRITICAL] app/services/payment_service.rb:8 — 并发支付竞态条件
   修复：添加幂等性键参数，Stripe 保证不重复扣款
   → A) 修复  B) 跳过

2. [CRITICAL] app/services/payment_service.rb:8 — Stripe 异常未处理
   修复：添加 begin/rescue 块，优雅处理各种 Stripe 错误
   → A) 修复  B) 跳过

3. [HIGH] app/models/order.rb:5 — 订单状态完整性
   修复：添加状态转换方法，确保正确状态流
   → A) 修复  B) 跳过

RECOMMENDATION: 修复全部 — 这些是生产环境真实风险。
```

#### 修复后

```ruby
# app/services/payment_service.rb
def process_payment(user_id, amount, idempotency_key: nil)
  user = User.includes(:orders).find(user_id) # 修复 N+1
  
  begin
    stripe_charge = Stripe::Charge.create(
      amount: amount,
      currency: 'usd',
      customer: user.stripe_customer_id,
      idempotency_key: idempotency_key # 修复竞态条件
    )
    
    Order.create_with_status!(
      user: user,
      amount: amount,
      stripe_charge_id: stripe_charge.id,
      status: 'completed'
    )
  rescue Stripe::CardError => e
    # 处理卡错误
    raise PaymentFailed, "卡错误: #{e.message}"
  rescue Stripe::RateLimitError => e
    # 处理限流
    retry_after(2)
  rescue Stripe::InvalidRequestError => e
    # 处理无效请求
    raise PaymentFailed, "请求无效: #{e.message}"
  rescue Stripe::AuthenticationError => e
    # 处理认证错误
    raise PaymentConfigurationError, "Stripe 配置错误"
  rescue Stripe::APIConnectionError => e
    # 处理连接错误
    raise PaymentServiceUnavailable, "支付服务暂时不可用"
  rescue Stripe::StripeError => e
    # 处理其他 Stripe 错误
    raise PaymentFailed, "支付失败: #{e.message}"
  end
end
```

**结果：**
- 重复收费归零
- 支付失败有明确消息
- 异常分类处理
- 状态机完整

### 我的建议：如何最大化/review 的价值

#### 建议 1：不要跳过 Fix-First

即使你觉得"这个简单，我自己修"。

**让`/review`自动修复。** 这样你能专注于真正需要判断的问题。

#### 建议 2：认真对待范围检查

范围漂移和需求缺失是常见问题。

**确保你构建了正确的东西，不仅仅是构建得好。**

#### 建议 3：启用 Greptile 集成

[Greptile](https://greptile.com) 是免费的 GitHub 应用。

安装后，`/review`自动集成，提供双层审查。

#### 建议 4：考虑 Codex 第二意见

不同的 AI 有不同的盲点。

**两个 AI 审查比一个更可靠。**

### 结语：偏执的价值

大多数人认为"偏执"是负面词。

在软件工程中，**偏执是美德**。

`/review`编码了这种偏执：
- 假设每个 API 调用都会失败
- 假设每个用户都会恶意使用
- 假设每个并发场景都会发生
- 假设每个边界情况都会被触发

**这不是悲观，是专业。**

在 AI 时代，编码的边际成本趋近于零。

**偏执的价值被放大了 1000 倍。**

因为一次生产事故的成本远超 1000 倍的预防成本。

所以，拥抱偏执。

运行`/review`。

---

**下一章：/qa——系统性测试与自动修复**

我们会讲解：
- 从"手动测试"到"系统测试"的转变
- 四层模式：快速、标准、穷尽、回归
- 自动回归测试生成
- 实战案例：从 bug 发现到修复闭环
