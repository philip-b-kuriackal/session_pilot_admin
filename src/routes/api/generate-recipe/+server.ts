import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
	if (!env.OPENAI_API_KEY) {
		return json({ error: 'OpenAI API Key is missing.' }, { status: 500 });
	}

	const { name } = await request.json();

	if (!name) {
		return json({ error: 'Menu item name is required.' }, { status: 400 });
	}

	try {
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${env.OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content: `You are an expert fast food recipe creator for Proxie. 
            Given the name of a menu item, you will output a JSON object containing two fields:
            1. "ingredients": A bulleted list of the pre-prepared ingredients. Keep it concise.
            2. "preparation_steps": A step-by-step preparation guide. Use headings like "Chicken" or "Bun" and bullet points underneath.

            Example output:
            {
              "ingredients": "\\n• Cooked, breaded chicken filet\\n• Brioche bun\\n• Pickles\\n• Signature sauce",
              "preparation_steps": "\\nChicken\\n• Take from approved holding unit\\n• Check hold time and quality\\n\\nStandard: Hot, crispy, within hold time\\n\\nBun\\n• Toast bun as per standard"
            }
            
            Return ONLY valid JSON. No markdown code blocks surrounding the output.`
					},
					{
						role: 'user',
						content: `Generate the recipe for: ${name}`
					}
				],
				temperature: 0.7,
				response_format: { type: 'json_object' }
			})
		});

		if (!response.ok) {
			const errData = await response.json().catch(() => ({}));
			console.error('OpenAI Error:', errData);
			return json({ error: errData.error?.message || 'Failed to contact AI service.' }, { status: response.status });
		}

		const data = await response.json();
		let aiOutput = data.choices[0].message.content.trim();
		
		// Remove markdown code blocks if OpenAI still includes them despite instructions
		if (aiOutput.startsWith('```json')) {
			aiOutput = aiOutput.replace(/^```json\n/, '').replace(/\n```$/, '');
		} else if (aiOutput.startsWith('```')) {
			aiOutput = aiOutput.replace(/^```\n/, '').replace(/\n```$/, '');
		}

		const recipe = JSON.parse(aiOutput);

		return json(recipe);
		
	} catch (err: any) {
		console.error('Generate Recipe API Error:', err);
		return json({ error: err.message || 'An unexpected error occurred.' }, { status: 500 });
	}
}
