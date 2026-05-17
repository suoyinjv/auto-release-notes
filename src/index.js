const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const token = core.getInput('token', { required: true });
    const tagPrefix = core.getInput('tag-prefix') || 'v';
    const isDraft = core.getInput('draft').toLowerCase() === 'true';
    const isPrerelease = core.getInput('prerelease').toLowerCase() === 'true';

    const octokit = github.getOctokit(token);
    const { owner, repo } = github.context.repo;

    // Get latest tag
    let latestTag = null;
    let latestTagSha = null;
    try {
      const { data: tags } = await octokit.rest.repos.listTags({
        owner, repo, per_page: 1
      });
      if (tags.length > 0) {
        latestTag = tags[0].name;
        latestTagSha = tags[0].commit.sha;
      }
    } catch (e) {
      core.info('No existing tags found, will get all commits');
    }

    // Get commits since last tag or all commits
    let commits = [];
    if (latestTagSha) {
      const { data: compareResult } = await octokit.rest.repos.compareCommits({
        owner, repo,
        base: latestTagSha,
        head: github.context.sha
      });
      commits = compareResult.commits || [];
    } else {
      const { data: allCommits } = await octokit.rest.repos.listCommits({
        owner, repo, per_page: 100
      });
      commits = allCommits;
    }

    // Categorize commits by conventional commit type
    const categories = {
      feat: { label: '🚀 Features', items: [] },
      fix: { label: '🐛 Bug Fixes', items: [] },
      docs: { label: '📖 Documentation', items: [] },
      refactor: { label: '♻️ Code Refactoring', items: [] },
      perf: { label: '⚡ Performance Improvements', items: [] },
      test: { label: '🧪 Tests', items: [] },
      build: { label: '🏗️ Build System', items: [] },
      ci: { label: '👷 CI/CD', items: [] },
      chore: { label: '🔧 Chores', items: [] },
      style: { label: '🎨 Code Style', items: [] },
      other: { label: '📝 Other Changes', items: [] }
    };

    for (const commit of commits) {
      const msg = commit.commit.message || '';
      const firstLine = msg.split('\n')[0].trim();
      const shortSha = commit.sha.substring(0, 7);

      // Detect type from conventional commit
      let type = 'other';
      const match = firstLine.match(/^(\w+)(?:\((.+)\))?:/);
      if (match && categories[match[1]]) {
        type = match[1];
      }

      // Extract description (remove type prefix)
      let description = firstLine;
      if (match) {
        description = match[0].replace(match[1], '').trim();
        if (match[2]) {
          description = `**${match[2]}**: ${firstLine.substring(match[0].length).trim()}`;
        } else {
          description = firstLine.substring(match[0].length).trim();
        }
      }

      categories[type].items.push(
        `- ${description} ([${shortSha}](https://github.com/${owner}/${repo}/commit/${commit.sha}))`
      );
    }

    // Build release notes markdown
    let releaseNotes = '';
    let hasContent = false;
    for (const [key, cat] of Object.entries(categories)) {
      if (cat.items.length > 0) {
        releaseNotes += `## ${cat.label}\n\n${cat.items.join('\n')}\n\n`;
        hasContent = true;
      }
    }

    if (!hasContent) {
      releaseNotes = 'No significant changes in this release.\n';
    }

    // Detect version from latest tag or compute
    let version;
    if (latestTag) {
      const verMatch = latestTag.match(/\d+\.\d+\.\d+/);
      if (verMatch) {
        const [major, minor, patch] = verMatch[0].split('.').map(Number);
        if (categories.fix.items.length > 0 && categories.feat.items.length === 0) {
          version = `${tagPrefix}${major}.${minor}.${patch + 1}`;
        } else {
          version = `${tagPrefix}${major}.${minor + 1}.0`;
        }
      } else {
        version = `${tagPrefix}1.0.0`;
      }
    } else {
      version = `${tagPrefix}1.0.0`;
    }

    core.setOutput('release-notes', releaseNotes);
    core.setOutput('release-version', version);

    // Create tag and release
    try {
      await octokit.rest.git.createRef({
        owner, repo,
        ref: `refs/tags/${version}`,
        sha: github.context.sha
      });
    } catch (e) {
      core.info(`Tag ${version} may already exist: ${e.message}`);
    }

    const { data: release } = await octokit.rest.repos.createRelease({
      owner, repo,
      tag_name: version,
      name: `Release ${version}`,
      body: releaseNotes,
      draft: isDraft,
      prerelease: isPrerelease
    });

    core.setOutput('release-url', release.html_url);
    core.info(`✅ Release created: ${release.html_url}`);

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
  }
}

run();
