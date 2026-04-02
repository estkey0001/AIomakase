const Anthropic = require('@anthropic-ai/sdk');
const { getUser } = require('../db/users');
const { getHistory, saveHistory } = require('../db/history');
const { buildSystemPrompt } = require('./system-prompt');
const { allTools } = require('./tools');
const { executeTool } = require('./tool-executor');

const anthropic = new Anthropic();

async function runAgent(lineUserId, userMessage) {
  const userSettings = getUser(lineUserId);
  const history = getHistory(lineUserId);
  const systemPrompt = buildSystemPrompt(userSettings);

  const messages = [
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage }
  ];

  let response;
  let loopCount = 0;
  const maxLoops = 10;

  while (loopCount < maxLoops) {
    loopCount++;

    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools: allTools,
      messages
    });

    if (response.stop_reason === 'end_turn') break;

    if (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use');

      const toolResults = await Promise.all(
        toolUseBlocks.map(async (block) => {
          try {
            const result = await executeTool(lineUserId, block.name, block.input);
            return {
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result)
            };
          } catch (error) {
            console.error(`Tool ${block.name} error:`, error);
            return {
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify({ error: error.message }),
              is_error: true
            };
          }
        })
      );

      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
    }
  }

  const finalText = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');

  await saveHistory(lineUserId, userMessage, finalText);
  return finalText;
}

module.exports = { runAgent };
