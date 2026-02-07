# OMDb API Setup Instructions

The Oscar nominations service uses the OMDb API (Open Movie Database) to fetch movie awards data.

## Getting Your Free API Key

1. Visit: http://www.omdbapi.com/apikey.aspx
2. Select the **FREE** plan (1,000 daily requests)
3. Enter your email address
4. Check your email for the API key
5. Activate the key by clicking the verification link in the email

## Setting Up the API Key

1. Open the `.env` file in the `api` folder
2. Uncomment and add your API key:
   ```
   OMDB_API_KEY=your_actual_api_key_here
   ```
3. Save the file
4. Restart your server if it's running

## Testing the Service

### Using the test script:
```bash
npx tsx src/services/test-oscars.ts
```

### Using the API endpoint:
```bash
# Basic request
curl http://localhost:5000/api/oscars/The%20Dark%20Knight

# With year parameter for more accurate results
curl "http://localhost:5000/api/oscars/The%20Dark%20Knight?year=2008"
```

### Example Response:
```json
{
  "title": "The Dark Knight",
  "nominations": 8,
  "awards": "Nominated for 8 Oscars. Another 160 wins & 163 nominations"
}
```

## Notes

- The free tier allows 1,000 requests per day
- Adding the `year` parameter helps when there are multiple movies with the same title
- The service returns `0` nominations if the movie is not found or has no Oscar nominations
