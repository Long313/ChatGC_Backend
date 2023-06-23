import { Injectable, NotFoundException } from '@nestjs/common';
import { languages } from 'common/constants';
import { Configuration, OpenAIApi } from 'openai';

@Injectable()
export class TranslateService {
  private readonly openAI: OpenAIApi;

  constructor() {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.openAI = new OpenAIApi(configuration);
  }

  public async translate(text: string, langCode: string): Promise<string> {
    const language = languages[`${langCode}`];

    if (!language) {
      throw new NotFoundException('This language is not supported');
    }

    const res = await this.openAI.createCompletion({
      model: 'text-davinci-003',
      prompt: `Translate this into ${language}:\n\n${text}\n\n1.`,
      temperature: 0.3,
      max_tokens: 500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    return res.data.choices[0].text || '';
  }
}
