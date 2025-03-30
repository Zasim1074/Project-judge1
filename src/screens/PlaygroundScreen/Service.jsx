const languageCodemap = {
  cpp: 54,
  python: 71,
  java: 62,
  javascript: 63,
};

async function getSubmission(tokenId) {
  const url = `https://judge0-ce.p.rapidapi.com/submissions/${tokenId}?base64_encoded=true&fields=*`;
  const options = {
    method: "GET",
    headers: {
      "x-rapidapi-key": "c1b2add7b1msha475ba7f35d6d34p1342edjsn1ca5c99266f4",
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
    },
  };

  try {
    let response, result;
    let attempts = 0;

    // ⏳ Polling until the execution is completed (Max 10 retries)
    while (attempts < 10) {
      response = await fetch(url, options);
      result = await response.json();

      if (result.status?.id <= 2) {
        // If the status is 1 (In Queue) or 2 (Processing), wait and retry
        await new Promise((res) => setTimeout(res, 1000));
      } else {
        break; // Exit loop when execution is completed
      }

      attempts++;
    }

    return result;
  } catch (error) {
    console.error("Error fetching submission result:", error);
    return { error: error.message };
  }
}

export async function makeSubmission({ code, language, stdin, callback }) {
  const url = `https://judge0-ce.p.rapidapi.com/submissions?base64_encoded=true&wait=false&fields=*`;
  const httpOptions = {
    method: "POST",
    headers: {
      "x-rapidapi-key": "c1b2add7b1msha475ba7f35d6d34p1342edjsn1ca5c99266f4",
      "x-rapidapi-host": "judge0-ce.p.rapidapi.com",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language_id: languageCodemap[language],
      source_code: btoa(code), // ✅ Fixed encoding
      stdin: btoa(stdin), // ✅ Fixed encoding
    }),
  };

  try {
    callback({ apiStatus: "loading" });

    const response = await fetch(url, httpOptions);
    const result = await response.json();
    const tokenId = result.token;

    if (!tokenId) {
      throw new Error(
        `Submission token not received. API Response: ${JSON.stringify(result)}`
      );
    }

    // ✅ Fetching the submission result with retry mechanism
    const apiSubmissionResult = await getSubmission(tokenId);

    if (!apiSubmissionResult || apiSubmissionResult.error) {
      callback({
        apiStatus: "error",
        message: `Failed to fetch execution results from Judge0: ${
          apiSubmissionResult.error || "Unknown error"
        }`,
      });
      return;
    }

    const statusCode = apiSubmissionResult.status.id;

    // ✅ Properly handling errors
    if (statusCode === 6) {
      callback({
        apiStatus: "error",
        message: "Compilation Error",
        data: apiSubmissionResult,
      });
      return;
    } else if (statusCode === 11) {
      callback({
        apiStatus: "error",
        message: "Runtime Error",
        data: apiSubmissionResult,
      });
      return;
    }

    const decodedOutput = apiSubmissionResult.stdout
      ? window.atob(apiSubmissionResult.stdout) // ✅ Fixed decoding
      : apiSubmissionResult.stderr
      ? window.atob(apiSubmissionResult.stderr) // ✅ Fixed decoding
      : "No output";

    // ✅ Callback now sends decoded output correctly
    callback({
      apiStatus: "success",
      data: { ...apiSubmissionResult, decodedOutput },
    });
  } catch (error) {
    callback({ apiStatus: "error", message: error.message });
  }
}
