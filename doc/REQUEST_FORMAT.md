# Request File Format

The API Comparator supports two JSON file formats for defining requests:

## New Structured Format (Recommended)

The structured format allows you to define variables and headers at the top level, with optional environment-specific overrides.

```json
{
  "configuration": {
    "variables": {
      "apiVersion": "v1",
      "commonParam": "shared-value"
    },
    "headers": {
      "User-Agent": "API-Comparator/1.0",
      "Accept": "application/json"
    },
    "referenceConfiguration": {
      "variables": {
        "environment": "reference",
        "apiKey": "ref-api-key-123"
      },
      "headers": {
        "X-Environment": "reference"
      }
    },
    "targetConfiguration": {
      "variables": {
        "environment": "target",
        "apiKey": "target-api-key-456"
      },
      "headers": {
        "X-Environment": "target"
      }
    }
  },
  "requests": [
    {
      "url": "{{baseUrl}}/api/{{apiVersion}}/users",
      "method": "GET"
    },
    {
      "url": "{{baseUrl}}/data",
      "method": "POST",
      "body": {
        "key": "value",
        "environment": "{{environment}}",
        "apiKey": "{{apiKey}}"
      },
      "headers": {
        "X-Custom-Header": "{{commonParam}}"
      }
    }
  ]
}
```

### Configuration Structure

#### `configuration` (optional)
Top-level configuration that applies to all requests.

- **`variables`** (optional): Key-value pairs for variable replacement. Variables can be used in URLs, headers, and body using `{{variableName}}` syntax.

- **`headers`** (optional): Headers that will be sent with all requests to both reference and target environments.

- **`referenceConfiguration`** (optional): Environment-specific configuration for reference environment.
  - **`variables`**: Variables specific to reference environment (override base variables)
  - **`headers`**: Headers specific to reference environment (override base headers)

- **`targetConfiguration`** (optional): Environment-specific configuration for target environment.
  - **`variables`**: Variables specific to target environment (override base variables)
  - **`headers`**: Headers specific to target environment (override base headers)

### Variable Replacement

Variables are replaced in:
- **URLs**: `{{baseUrl}}/api/{{version}}/users`
- **Headers**: `X-API-Key: {{apiKey}}`
- **Body strings**: `"environment": "{{envName}}"`
- **Body object values**: All string values in request body objects are checked for variables

### Merging Rules

1. **Base + Environment-specific**: Configuration defined in `referenceConfiguration` or `targetConfiguration` overrides the base `variables` and `headers`.

2. **Configuration + CLI**: Headers and variables from command-line arguments override those from the configuration file.

3. **Request + Configuration**: Headers defined in individual requests are merged with configuration headers, with request headers taking precedence.

## Legacy Array Format (Still Supported)

The simple array format is still fully supported for backward compatibility:

```json
[
  {
    "url": "{{baseUrl}}/path/to/resource",
    "method": "GET"
  },
  {
    "url": "{{baseUrl}}/path/to/another-resource",
    "method": "POST",
    "body": {
      "key": "value"
    }
  }
]
```

In this format:
- No built-in variable support (except `{{baseUrl}}`)
- Headers must be provided via command-line arguments
- All configuration is done through CLI flags

## Request Object Properties

Both formats use the same request object structure:

- **`url`** (required if no `referenceUrl`/`targetUrl`): The endpoint path, typically using `{{baseUrl}}` placeholder
- **`referenceUrl`** (optional): Specific URL for reference environment (overrides `url`)
- **`targetUrl`** (optional): Specific URL for target environment (overrides `url`)
- **`method`** (optional, default: `GET`): HTTP method
- **`name`** (optional): Display name for the request in reports
- **`headers`** (optional): Request-specific headers
- **`body`** (optional): Request body - can be:
  - String: Sent as-is
  - Object: Automatically JSON.stringify'd and `Content-Type: application/json` header added

## Examples

### Different API Keys per Environment

```json
{
  "configuration": {
    "referenceConfiguration": {
      "variables": {
        "apiKey": "prod-key-123"
      }
    },
    "targetConfiguration": {
      "variables": {
        "apiKey": "staging-key-456"
      }
    }
  },
  "requests": [
    {
      "url": "{{baseUrl}}/protected",
      "method": "GET",
      "headers": {
        "Authorization": "Bearer {{apiKey}}"
      }
    }
  ]
}
```

### Version Testing

```json
{
  "configuration": {
    "variables": {
      "version": "v2"
    }
  },
  "requests": [
    {
      "url": "{{baseUrl}}/api/{{version}}/status",
      "method": "GET"
    }
  ]
}
```

### Dynamic Body Content

```json
{
  "configuration": {
    "variables": {
      "clientId": "test-client-001",
      "timestamp": "2025-11-14T12:00:00Z"
    }
  },
  "requests": [
    {
      "url": "{{baseUrl}}/events",
      "method": "POST",
      "body": {
        "client": "{{clientId}}",
        "timestamp": "{{timestamp}}",
        "event": "test_event"
      }
    }
  ]
}
```
