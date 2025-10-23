/**
 * Process Models Script
 * Converts fal_models_with_examples.csv to fal_models.json
 */

import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CSVRow {
  slug: string;
  name: string;
  category?: string;
  description: string;
  pricing_display: string;
  pricing_value: number;
  pricing_currency: string;
  pricing_unit: string;
  example_js?: string;
  example_python?: string;
  model_url: string;
}

interface FalModel {
  slug: string;
  name: string;
  category: string;
  description: string;
  pricing: {
    display: string;
    value: number;
    currency: string;
    unit: string;
  };
  examples: {
    javascript?: string;
    python?: string;
  };
  url: string;
}

async function processModelsCSV() {
  console.log('Processing Fal AI models CSV...');

  try {
    // Read CSV file
    const csvPath = join(__dirname, '../fal_models_with_examples.csv');
    const csvContent = await readFile(csvPath, 'utf-8');

    console.log('CSV file loaded, parsing...');

    // Parse CSV
    const parsed = Papa.parse<CSVRow>(csvContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (parsed.errors.length > 0) {
      console.error('CSV parsing errors:', parsed.errors);
    }

    console.log(`Parsed ${parsed.data.length} rows`);

    // Transform data
    const models: FalModel[] = parsed.data.map((row) => ({
      slug: row.slug,
      name: row.name,
      category: row.category || 'general',
      description: row.description,
      pricing: {
        display: row.pricing_display,
        value: row.pricing_value,
        currency: row.pricing_currency,
        unit: row.pricing_unit,
      },
      examples: {
        javascript: row.example_js,
        python: row.example_python,
      },
      url: row.model_url,
    }));

    // Write JSON file
    const jsonPath = join(__dirname, '../data/fal_models.json');
    await writeFile(jsonPath, JSON.stringify(models, null, 2));

    console.log(`✓ Successfully processed ${models.length} models`);
    console.log(`✓ Output written to: ${jsonPath}`);

    // Print statistics
    const categories = new Set(models.map((m) => m.category));
    const categoryBreakdown: Record<string, number> = {};

    for (const model of models) {
      categoryBreakdown[model.category] =
        (categoryBreakdown[model.category] || 0) + 1;
    }

    console.log('\nCategory Breakdown:');
    Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} models`);
      });
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      console.error(
        'Error: fal_models_with_examples.csv not found in project root'
      );
      console.error(
        'Please ensure the CSV file exists before running this script.'
      );
    } else {
      console.error('Error processing CSV:', error);
    }
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  processModelsCSV();
}

export { processModelsCSV };
