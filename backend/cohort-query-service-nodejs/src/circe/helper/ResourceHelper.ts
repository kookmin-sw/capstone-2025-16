/*******************************************************************************
 * Copyright 2025 Observational Health Data Sciences and Informatics
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 ******************************************************************************/

import * as fs from 'fs';
import * as path from 'path';

export class ResourceHelper {
  /**
   * Read a resource file as string.
   * This method will try several locations to handle both development and production environments.
   * 
   * @param resourcePath The path to the resource file (without leading slash)
   * @returns The content of the resource file as string
   * @throws Error if the resource file is not found
   */
  public static GetResourceAsString(resourcePath: string): string {
    // Try multiple possible paths to find the resource
    const possiblePaths = [
      // Path when running from source (TypeScript)
      path.resolve(__dirname, '../resources', resourcePath),
      // Path when running from compiled JS (dist directory)
      path.resolve(__dirname, '../resources', resourcePath),
      // Path for compiled JS in dist with full structure
      path.resolve(process.cwd(), 'dist/circe/resources', resourcePath),
      // Path for source
      path.resolve(process.cwd(), 'src/circe/resources', resourcePath),
    ];
    
    // Remove any leading slash from resourcePath to standardize the path format
    const normalizedPath = resourcePath.replace(/^\/+/, '');
    
    // Also try with normalized path
    possiblePaths.push(
      path.resolve(__dirname, '../resources', normalizedPath),
      path.resolve(process.cwd(), 'dist/circe/resources', normalizedPath),
      path.resolve(process.cwd(), 'src/circe/resources', normalizedPath)
    );
    
    for (const fullPath of possiblePaths) {
      try {
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf8');
          return content;
        }
      } catch (error) {
        // Continue trying other paths
      }
    }
    
    // If we get here, the resource was not found in any of the possible locations
    console.error(`Failed to read resource file: ${resourcePath} - tried paths:`, possiblePaths);
    throw new Error(`Resource not found: ${resourcePath}`);
  }
}

export default ResourceHelper;