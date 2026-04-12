
import sql from './db';

// --- Типы и интерфейсы ---

/**
 * Параметры для генерации описания объекта недвижимости.
 */
interface GenerateDescriptionParams {
  title: string;
  type: 'house' | 'apartment' | 'plot' | 'complex';
  district: string;
  price: number;
  area: number;
  features: string[];
}

/**
 * Параметры для генерации SEO-метаданных.
 */
interface GenerateSeoMetaParams {
  title: string;
  type: string;
  district: string;
  price: number;
  area: number;
}

/**
 * Структура ответа для SEO-метаданных.
 */
interface SeoMeta {
  title: string;
  description: string;
  keywords: string[];
}

/**
 * Типы для объектов недвижимости из БД.
 */
interface PropertyMedia {
    url: string;
    type: 'image' | 'video';
    tags?: string[];
    order: number;
}


// --- Переменные окружения и константы ---

const YANDEX_LLM_API_KEY = process.env.YANDEX_LLM_API_KEY;
const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID || 'b1gcr5m4ptniag2qpsqm';
const YANDEX_VISION_MODEL = process.env.YANDEX_VISION_MODEL || 'gpt://b1gcr5m4ptniag2qpsqm/qwen3.5-35b-a3b-fp8/latest';
const YANDEX_LLM_MODEL = process.env.YANDEX_LLM_MODEL || 'gpt://b1gcr5m4ptniag2qpsqm/yandexgpt-5.1/latest';
const API_ENDPOINT = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';

const typeLabels = {
  house: 'Частный дом / ИЖС',
  apartment: 'Квартира в новостройке',
  plot: 'Земельный участок',
  complex: 'Жилой комплекс',
};

// --- Управление частотой запросов (Rate Limiting) ---

const requestTimestamps: number[] = [];
const MAX_REQUESTS_PER_SECOND = 5;

/**
 * Обеспечивает ограничение на количество запросов в секунду.
 */
async function rateLimit() {
  const now = Date.now();
  
  // Удаляем старые временные метки
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= now - 1000) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= MAX_REQUESTS_PER_SECOND) {
    const timeToWait = 1000 - (now - requestTimestamps[0]);
    console.log(`Rate limit exceeded. Waiting for ${timeToWait}ms`);
    await new Promise(resolve => setTimeout(resolve, timeToWait));
    // Рекурсивно вызываем, чтобы перепроверить после ожидания
    return rateLimit();
  }

  requestTimestamps.push(now);
}


// --- Основные функции ---

/**
 * Анализирует изображение объекта недвижимости и возвращает массив тегов.
 * @param imageUrl URL изображения для анализа.
 * @returns Промис, который разрешается массивом тегов.
 */
export async function analyzePhoto(imageUrl: string): Promise<string[]> {
  try {
    await rateLimit();

    // 1. Скачать изображение и конвертировать в base64
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageBase64 = Buffer.from(imageBuffer).toString('base64');

    // 2. Отправить запрос к Yandex Foundation Models API
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${YANDEX_LLM_API_KEY}`,
        'Content-Type': 'application/json',
        'x-folder-id': YANDEX_FOLDER_ID,
      },
      body: JSON.stringify({
        'modelUri': YANDEX_VISION_MODEL,
        'completionOptions': {
          'stream': false,
          'temperature': 0.3,
          'maxTokens': 1000
        },
        'messages': [
          {
            'role': 'user',
            'content': {
                'text': \'\'\'Посмотри на это фото объекта недвижимости в Сочи. Определи что изображено. Верни ТОЛЬКО массив JSON с тегами на русском языке из этого списка: фасад, вид на горы, вид на море, бассейн, кухня, терраса, гараж, сад, гостиная, спальня, ванная, детская, кабинет, баня, беседка, забор, подвал, лестница, панорама, ремонт, отделка. Пример ответа: ["фасад","терраса","вид на горы"]\'\'\',
                'image': {
                    'mimeType': imageResponse.headers.get('content-type') || 'image/jpeg',
                    'base64Data': imageBase64
                }
            }
          }
        ]
      })
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Yandex Vision API request failed: ${response.statusText} - ${errorBody}`);
    }
    
    const data = await response.json();
    const textResponse = data.result.alternatives[0].message.text;

    // 5. Распарсить JSON из ответа
    const tags = JSON.parse(textResponse);
    if (!Array.isArray(tags)) {
        throw new Error('Failed to parse tags: Not an array');
    }

    return tags;
  } catch (error) {
    console.error('Error in analyzePhoto:', error);
    // 6. При ошибке вернуть пустой массив
    return [];
  }
}

/**
 * Генерирует продающее описание для объекта недвижимости.
 * @param params Параметры объекта.
 * @returns Промис с текстовым описанием.
 */
export async function generateDescription(params: GenerateDescriptionParams): Promise<string> {
    try {
        await rateLimit();

        // 1. Формирование промптов
        const systemPrompt = "Ты копирайтер для сайта недвижимости homesrf.ru в Сочи. Пиши в стиле Relax — без давления, эстетично, информативно, с теплотой. Без клише типа 'уникальное предложение' или 'не упустите шанс'. Максимум 300 слов. Только текст, без заголовков и маркированных списков.";
        
        const userPrompt = `Тип объекта: ${typeLabels[params.type]}
Название: ${params.title}
Район Сочи: ${params.district}
Площадь: ${params.area} м²
Цена: ${params.price.toLocaleString('ru-RU')} ₽
Особенности: ${params.features.join(', ')}
Напиши продающее описание для сайта.`;

        // 2. Отправка запроса к YandexGPT
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Api-Key ${YANDEX_LLM_API_KEY}`,
                'Content-Type': 'application/json',
                'x-folder-id': YANDEX_FOLDER_ID,
            },
            body: JSON.stringify({
                'modelUri': YANDEX_LLM_MODEL,
                'completionOptions': {
                    'stream': false,
                    'temperature': 0.7,
                    'maxTokens': 2000
                },
                'messages': [
                    { 'role': 'system', 'text': systemPrompt },
                    { 'role': 'user', 'text': userPrompt }
                ]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Yandex LLM API request failed: ${response.statusText} - ${errorBody}`);
        }

        const data = await response.json();
        return data.result.alternatives[0].message.text.trim();

    } catch (error) {
        console.error('Error in generateDescription:', error);
        return ''; // Возвращаем пустую строку в случае ошибки
    }
}

/**
 * Обрабатывает новое фото: анализирует его и сохраняет теги в БД.
 * @param photoUrl URL нового фото.
 * @param propertyId ID объекта недвижимости.
 */
export async function processNewPhoto(photoUrl: string, propertyId: number): Promise<void> {
    try {
        // 1. Получаем теги для фото
        const tags = await analyzePhoto(photoUrl);
        if (tags.length === 0) {
            console.log(`No tags found for photo: ${photoUrl}`);
            return;
        }

        // 2-3. Получаем текущие медиа-данные из БД
        const rows = await sql<[{media_urls: PropertyMedia[]}]>\`
            SELECT media_urls FROM properties WHERE id = \${propertyId}
        \`;
        
        if (rows.length === 0) {
            throw new Error(`Property with id ${propertyId} not found.`);
        }

        const mediaUrls = rows[0].media_urls || [];
        
        // 4. Находим и обновляем нужный элемент
        let photoFound = false;
        const updatedMedia = mediaUrls.map(media => {
            if (media.url === photoUrl) {
                photoFound = true;
                return { ...media, tags: [...(media.tags || []), ...tags] };
            }
            return media;
        });

        if (!photoFound) {
            // Если фото по какой-то причине не найдено, можно его добавить
            console.warn(`Photo URL ${photoUrl} not found in media_urls for property ${propertyId}. Adding it.`);
            updatedMedia.push({ url: photoUrl, type: 'image', tags: tags, order: mediaUrls.length });
        }
        
        // 6. Сохраняем обновленный массив
        await sql\`
            UPDATE properties 
            SET media_urls = \${JSON.stringify(updatedMedia)}::jsonb 
            WHERE id = \${propertyId}
        \`;

        // 7. Логирование
        console.log(`Photo tagged: ${photoUrl} → ${tags.join(', ')}`);

    } catch (error) {
        console.error('Error in processNewPhoto:', error);
    }
}


/**
 * (Бонус) Генерирует SEO-метаданные для страницы объекта.
 * @param property Параметры объекта.
 * @returns Промис с объектом SEO-метаданных.
 */
export async function generateSeoMeta(property: GenerateSeoMetaParams): Promise<SeoMeta> {
    const defaultMeta: SeoMeta = {
        title: `${property.type} ${property.area}м² в ${property.district} | HOMESRF`,
        description: `Продаётся ${property.type.toLowerCase()} в районе ${property.district}, Сочи. Площадь ${property.area} м², цена ${property.price.toLocaleString('ru-RU')} ₽. Подробности на сайте HOMESRF.`,
        keywords: ['недвижимость в сочи', property.type, property.district]
    };

    try {
        await rateLimit();
        
        const prompt = `Сгенерируй SEO-метаданные для страницы объекта недвижимости.
Верни ТОЛЬКО JSON без markdown:
{
  "title": "...до 60 символов...",
  "description": "...до 160 символов...",
  "keywords": ["ключевое слово 1", "ключевое слово 2", "...до 8 слов"]
}
Объект: ${property.type} в ${property.district}, ${property.area}м², ${property.price.toLocaleString('ru-RU')}₽`;

        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Api-Key ${YANDEX_LLM_API_KEY}`,
                'Content-Type': 'application/json',
                'x-folder-id': YANDEX_FOLDER_ID,
            },
            body: JSON.stringify({
                'modelUri': YANDEX_LLM_MODEL,
                'completionOptions': { 'stream': false, 'temperature': 0.5, 'maxTokens': 500 },
                'messages': [{ 'role': 'user', 'text': prompt }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`Yandex LLM API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        const jsonString = data.result.alternatives[0].message.text;
        
        // Попытка извлечь JSON из ответа, даже если он обернут в markdown
        const jsonMatch = jsonString.match(/```json\\n([\s\S]*?)\\n```/);
        const parsableString = jsonMatch ? jsonMatch[1] : jsonString;
        
        const parsedMeta = JSON.parse(parsableString);
        return { ...defaultMeta, ...parsedMeta };
        
    } catch (error) {
        console.error('Error in generateSeoMeta:', error);
        return defaultMeta; // Возвращаем дефолтные значения при ошибке
    }
}
