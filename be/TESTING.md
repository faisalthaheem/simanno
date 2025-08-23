# Testing API Routes

This project includes unit tests for the API routes defined in `api_routes.py`.

## Running Tests

To run the tests, you'll need to install pytest:

```bash
pip install pytest pytest-asyncio
```

Then run the tests:

```bash
pytest test_api_routes.py -v
```

## Test Coverage

The tests cover:

1. **read_root()** - Tests the basic endpoint that returns a message
2. **set_label_to()** - Tests label setting with valid and invalid label IDs
3. **get_roi_wall_data()** - Tests data retrieval functionality
4. **delete_image()** - Tests image deletion with missing header
5. **get_labels()** - Tests label retrieval functionality

## Notes

- The API routes are async functions, but the tests are written for synchronous execution
- The tests focus on validation logic and basic functionality
- For complete test coverage of async functions, more complex mocking would be required
- The current tests verify the basic behavior and error handling of the API endpoints

## Test Structure

The test file `test_api_routes.py` contains:
- Individual test functions for each API endpoint
- Tests for both success and error conditions
- Validation of return values and error messages
