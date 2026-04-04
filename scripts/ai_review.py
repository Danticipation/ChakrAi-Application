import os, json, textwrap, requests
from openai import OpenAI

GITHUB_API = "https://api.github.com"

def gh_get(url, token):
    r = requests.get(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    })
    r.raise_for_status()
    return r.json()

def gh_post(url, token, payload):
    r = requests.post(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github+json"
    }, json=payload)
    r.raise_for_status()
    return r.json()

def load_pr_context():
    event_path = os.environ["GITHUB_EVENT_PATH"]
    with open(event_path, "r", encoding="utf-8") as f:
        event = json.load(f)
    repo = os.environ["GITHUB_REPOSITORY"]                # owner/repo
    pr_number = event["pull_request"]["number"]
    return repo, pr_number

def get_pr_diff(repo, pr_number, token, max_chars=55000):
    files = gh_get(f"{GITHUB_API}/repos/{repo}/pulls/{pr_number}/files", token)
    chunks = []
    total = 0
    for f in files:
        patch = f.get("patch")
        if not patch:
            continue
        header = f"\n--- FILE: {f['filename']} (+{f['additions']}/-{f['deletions']})\n"
        piece = header + patch + "\n"
        if total + len(piece) > max_chars:
            break
        chunks.append(piece)
        total += len(piece)
    return "".join(chunks) if chunks else "No textual patch content found."

def call_openai_review(diff_text):
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    system = (
        "You are a senior code reviewer. "
        "Identify correctness issues, security concerns, performance hotspots, "
        "edge cases, missing tests, and unclear code. Be specific and actionable. "
        "When suggesting changes, show concrete diffs or snippets."
    )
    user = (
        "Review this pull request diff. Focus on real risks and test gaps. "
        "Keep the response structured with headings and bullet points.\n\n"
        f"{diff_text}"
    )
    resp = client.chat.completions.create(
        model=model,
        messages=[{"role": "system", "content": system},
                  {"role": "user", "content": user}],
        temperature=0.2,
    )
    return resp.choices[0].message.content.strip()

def post_issue_comment(repo, pr_number, token, body):
    # PRs are also issues; comment there for a single consolidated review
    url = f"{GITHUB_API}/repos/{repo}/issues/{pr_number}/comments"
    gh_post(url, token, {"body": body})

def main():
    token = os.environ["GITHUB_TOKEN"]              # provided by Actions
    repo, pr_number = load_pr_context()             # uses GITHUB_EVENT_PATH
    diff_text = get_pr_diff(repo, pr_number, token) # trims large diffs
    review = call_openai_review(diff_text)

    header = "## 🤖 AI Code Review\n"
    guidance = textwrap.dedent("""
        <sub>Model suggestions can be wrong—treat as a second set of eyes.
        For inline per-line comments, we can parse the diff and attach review comments to specific hunks.</sub>
    """).strip()

    # Create a PR review (single summary comment). This appears as a review, not an issue comment.
    url = f"{GITHUB_API}/repos/{repo}/pulls/{pr_number}/reviews"
    gh_post(url, token, {
        "body": f"{header}\n{review}\n\n{guidance}",
        "event": "COMMENT"
    })

if __name__ == "__main__":
    main()
