import { describe, expect, it, vi } from 'vitest';

import { OpenAIStream } from './openai';

describe('OpenAIStream', () => {
  it('should transform OpenAI stream to protocol stream', async () => {
    const mockOpenAIStream = new ReadableStream({
      start(controller) {
        controller.enqueue({
          choices: [
            {
              delta: { content: 'Hello' },
              index: 0,
            },
          ],
          id: '1',
        });
        controller.enqueue({
          choices: [
            {
              delta: { content: ' world!' },
              index: 1,
            },
          ],
          id: '1',
        });
        controller.enqueue({
          choices: [
            {
              delta: null,
              finish_reason: 'stop',
              index: 2,
            },
          ],
          id: '1',
        });

        controller.close();
      },
    });

    const onStartMock = vi.fn();
    const onTextMock = vi.fn();
    const onTokenMock = vi.fn();
    const onCompletionMock = vi.fn();

    const protocolStream = OpenAIStream(mockOpenAIStream, {
      onStart: onStartMock,
      onText: onTextMock,
      onToken: onTokenMock,
      onCompletion: onCompletionMock,
    });

    const decoder = new TextDecoder();
    const chunks = [];

    // @ts-ignore
    for await (const chunk of protocolStream) {
      chunks.push(decoder.decode(chunk, { stream: true }));
    }

    expect(chunks).toEqual([
      'id: 1\n',
      'event: text\n',
      `data: "Hello"\n\n`,
      'id: 1\n',
      'event: text\n',
      `data: " world!"\n\n`,
      'id: 1\n',
      'event: stop\n',
      `data: "stop"\n\n`,
    ]);

    expect(onStartMock).toHaveBeenCalledTimes(1);
    expect(onTextMock).toHaveBeenNthCalledWith(1, '"Hello"');
    expect(onTextMock).toHaveBeenNthCalledWith(2, '" world!"');
    expect(onTokenMock).toHaveBeenCalledTimes(2);
    expect(onCompletionMock).toHaveBeenCalledTimes(1);
  });

  it('should handle tool calls', async () => {
    const mockOpenAIStream = new ReadableStream({
      start(controller) {
        controller.enqueue({
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    function: { name: 'tool1', arguments: '{}' },
                    id: 'call_1',
                    index: 0,
                    type: 'function',
                  },
                  {
                    function: { name: 'tool2', arguments: '{}' },
                    id: 'call_2',
                    index: 1,
                  },
                ],
              },
              index: 0,
            },
          ],
          id: '2',
        });

        controller.close();
      },
    });

    const onToolCallMock = vi.fn();

    const protocolStream = OpenAIStream(mockOpenAIStream, {
      onToolCall: onToolCallMock,
    });

    const decoder = new TextDecoder();
    const chunks = [];

    // @ts-ignore
    for await (const chunk of protocolStream) {
      chunks.push(decoder.decode(chunk, { stream: true }));
    }

    expect(chunks).toEqual([
      'id: 2\n',
      'event: tool_calls\n',
      `data: [{"function":{"name":"tool1","arguments":"{}"},"id":"call_1","index":0,"type":"function"},{"function":{"name":"tool2","arguments":"{}"},"id":"call_2","index":1,"type":"function"}]\n\n`,
    ]);

    expect(onToolCallMock).toHaveBeenCalledTimes(1);
  });

  it('should handle empty stream', async () => {
    const mockStream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    const protocolStream = OpenAIStream(mockStream);

    const decoder = new TextDecoder();
    const chunks = [];

    // @ts-ignore
    for await (const chunk of protocolStream) {
      chunks.push(decoder.decode(chunk, { stream: true }));
    }

    expect(chunks).toEqual([]);
  });

  it('should handle delta content null', async () => {
    const mockOpenAIStream = new ReadableStream({
      start(controller) {
        controller.enqueue({
          choices: [
            {
              delta: { content: null },
              index: 0,
            },
          ],
          id: '3',
        });

        controller.close();
      },
    });

    const protocolStream = OpenAIStream(mockOpenAIStream);

    const decoder = new TextDecoder();
    const chunks = [];

    // @ts-ignore
    for await (const chunk of protocolStream) {
      chunks.push(decoder.decode(chunk, { stream: true }));
    }

    expect(chunks).toEqual(['id: 3\n', 'event: data\n', `data: {"content":null}\n\n`]);
  });

  it('should handle other delta data', async () => {
    const mockOpenAIStream = new ReadableStream({
      start(controller) {
        controller.enqueue({
          choices: [
            {
              delta: { custom_field: 'custom_value' },
              index: 0,
            },
          ],
          id: '4',
        });

        controller.close();
      },
    });

    const protocolStream = OpenAIStream(mockOpenAIStream);

    const decoder = new TextDecoder();
    const chunks = [];

    // @ts-ignore
    for await (const chunk of protocolStream) {
      chunks.push(decoder.decode(chunk, { stream: true }));
    }

    expect(chunks).toEqual([
      'id: 4\n',
      'event: data\n',
      `data: {"delta":{"custom_field":"custom_value"},"id":"4","index":0}\n\n`,
    ]);
  });

  it('should handle tool calls without index and type', async () => {
    const mockOpenAIStream = new ReadableStream({
      start(controller) {
        controller.enqueue({
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    function: { name: 'tool1', arguments: '{}' },
                    id: 'call_1',
                  },
                  {
                    function: { name: 'tool2', arguments: '{}' },
                    id: 'call_2',
                  },
                ],
              },
              index: 0,
            },
          ],
          id: '5',
        });

        controller.close();
      },
    });

    const protocolStream = OpenAIStream(mockOpenAIStream);

    const decoder = new TextDecoder();
    const chunks = [];

    // @ts-ignore
    for await (const chunk of protocolStream) {
      chunks.push(decoder.decode(chunk, { stream: true }));
    }

    expect(chunks).toEqual([
      'id: 5\n',
      'event: tool_calls\n',
      `data: [{"function":{"name":"tool1","arguments":"{}"},"id":"call_1","index":0,"type":"function"},{"function":{"name":"tool2","arguments":"{}"},"id":"call_2","index":1,"type":"function"}]\n\n`,
    ]);
  });

  it('should handle error when there is not correct error', async () => {
    const mockOpenAIStream = new ReadableStream({
      start(controller) {
        controller.enqueue({
          choices: [
            {
              delta: { content: 'Hello' },
              index: 0,
            },
          ],
          id: '1',
        });
        controller.enqueue({
          id: '1',
        });

        controller.close();
      },
    });

    const protocolStream = OpenAIStream(mockOpenAIStream);

    const decoder = new TextDecoder();
    const chunks = [];

    // @ts-ignore
    for await (const chunk of protocolStream) {
      chunks.push(decoder.decode(chunk, { stream: true }));
    }

    expect(chunks).toEqual(
      [
        'id: 1',
        'event: text',
        `data: "Hello"\n`,
        'id: 1',
        'event: error',
        `data: {"body":{"message":"chat response streaming chunk parse error, please contact your API Provider to fix it.","context":{"error":{"message":"Cannot read properties of undefined (reading '0')","name":"TypeError"},"chunk":{"id":"1"}}},"type":"StreamChunkError"}\n`,
      ].map((i) => `${i}\n`),
    );
  });

  it('should handle OpenRouter tool calls', async () => {
    const dataList = [
      {
        id: 'gen-Bx4R8TCbr4GElWZJtE30XGDQyoYW',
        model: 'anthropic/claude-3.5-sonnet',
        object: 'chat.completion.chunk',
        created: 1725817213,
        choices: [
          {
            index: 0,
            delta: {
              role: 'assistant',
              content:
                '为了回答您关于杭州天气的问题，我需要使用实时天气查询工具来获取最新的天气信息。让我为您查询一下。',
            },
            finish_reason: null,
            logprobs: null,
          },
        ],
      },
      {
        id: 'gen-Bx4R8TCbr4GElWZJtE30XGDQyoYW',
        model: 'anthropic/claude-3.5-sonnet',
        object: 'chat.completion.chunk',
        created: 1725817213,
        choices: [
          {
            delta: {
              role: 'assistant',
              content: null,
              tool_calls: [
                {
                  id: 'toolu_01M368ZnDFfJwaiVGL4evqhn',
                  index: 1,
                  type: 'function',
                  function: { name: 'realtime-weather____fetchCurrentWeather', arguments: '' },
                },
              ],
            },
            index: 0,
          },
        ],
      },
      {
        id: 'gen-Bx4R8TCbr4GElWZJtE30XGDQyoYW',
        model: 'anthropic/claude-3.5-sonnet',
        object: 'chat.completion.chunk',
        created: 1725817213,
        choices: [
          {
            delta: {
              role: 'assistant',
              content: null,
              tool_calls: [{ index: 1, type: 'function', function: { arguments: '{"city"' } }],
            },
            index: 0,
          },
        ],
      },
      {
        id: 'gen-Bx4R8TCbr4GElWZJtE30XGDQyoYW',
        model: 'anthropic/claude-3.5-sonnet',
        object: 'chat.completion.chunk',
        created: 1725817213,
        choices: [
          {
            delta: {
              role: 'assistant',
              content: null,
              tool_calls: [{ index: 1, type: 'function', function: { arguments: ':"杭州"}' } }],
            },
            index: 0,
          },
        ],
      },
      {
        id: 'gen-Bx4R8TCbr4GElWZJtE30XGDQyoYW',
        model: 'anthropic/claude-3.5-sonnet',
        object: 'chat.completion.chunk',
        created: 1725817213,
        choices: [
          { index: 0, delta: { role: 'assistant', content: '' }, finish_reason: 'tool_calls' },
        ],
      },
      {
        id: 'gen-Bx4R8TCbr4GElWZJtE30XGDQyoYW',
        model: 'anthropic/claude-3.5-sonnet',
        object: 'chat.completion.chunk',
        created: 1725817213,
        choices: [
          {
            index: 0,
            delta: { role: 'assistant', content: '' },
            finish_reason: null,
            logprobs: null,
          },
        ],
        usage: { prompt_tokens: 474, completion_tokens: 114, total_tokens: 588 },
      },
    ];
    const mockOpenAIStream = new ReadableStream({
      start(controller) {
        dataList.forEach((data) => {
          controller.enqueue(data);
        });

        controller.close();
      },
    });

    const onToolCallMock = vi.fn();

    const protocolStream = OpenAIStream(mockOpenAIStream, {
      onToolCall: onToolCallMock,
    });

    const decoder = new TextDecoder();
    const chunks = [];

    // @ts-ignore
    for await (const chunk of protocolStream) {
      chunks.push(decoder.decode(chunk, { stream: true }));
    }

    expect(chunks).toEqual(
      [
        'id: gen-Bx4R8TCbr4GElWZJtE30XGDQyoYW',
        'event: text',
        `data: "为了回答您关于杭州天气的问题，我需要使用实时天气查询工具来获取最新的天气信息。让我为您查询一下。"\n`,
        'id: gen-Bx4R8TCbr4GElWZJtE30XGDQyoYW',
        'event: tool_calls',
        `data: [{"function":{"name":"realtime-weather____fetchCurrentWeather","arguments":""},"id":"toolu_01M368ZnDFfJwaiVGL4evqhn","index":1,"type":"function"}]\n`,
        'id: gen-Bx4R8TCbr4GElWZJtE30XGDQyoYW',
        'event: tool_calls',
        `data: [{"function":{"arguments":"{\\"city\\""},"id":"toolu_01M368ZnDFfJwaiVGL4evqhn","index":1,"type":"function"}]\n`,
        'id: gen-Bx4R8TCbr4GElWZJtE30XGDQyoYW',
        'event: tool_calls',
        `data: [{"function":{"arguments":":\\"杭州\\"}"},"id":"toolu_01M368ZnDFfJwaiVGL4evqhn","index":1,"type":"function"}]\n`,
        'id: gen-Bx4R8TCbr4GElWZJtE30XGDQyoYW',
        'event: stop',
        `data: "tool_calls"\n`,
        'id: gen-Bx4R8TCbr4GElWZJtE30XGDQyoYW',
        'event: text',
        `data: ""\n`,
      ].map((i) => `${i}\n`),
    );

    expect(onToolCallMock).toHaveBeenCalledTimes(3);
  });
});
