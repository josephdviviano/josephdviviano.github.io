---
layout: page
permalink: /repositories/
title: repositories
description: Some projects I've worked on (that I can talk about).
nav: true
nav_order: 4
---

## Contribution Activity

<img class="repo-img-light w-100" alt="Snake eating my GitHub contribution graph" src="https://raw.githubusercontent.com/josephdviviano/josephdviviano.github.io/output/github-snake.svg">
<img class="repo-img-dark w-100" alt="Snake eating my GitHub contribution graph" src="https://raw.githubusercontent.com/josephdviviano/josephdviviano.github.io/output/github-snake-dark.svg">

---

{% if site.data.repositories.github_users %}

## GitHub users

<div class="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
  {% for user in site.data.repositories.github_users %}
    {% include repository/repo_user.liquid username=user %}
  {% endfor %}
</div>

---

{% if site.repo_trophies.enabled %}
{% for user in site.data.repositories.github_users %}
{% if site.data.repositories.github_users.size > 1 %}

  <h4>{{ user }}</h4>
  {% endif %}
  <div class="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
  {% include repository/repo_trophies.liquid username=user %}
  </div>

---

{% endfor %}
{% endif %}
{% endif %}

{% if site.data.repositories.github_repos %}

## GitHub Repositories

<div class="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
  {% for repo in site.data.repositories.github_repos %}
    {% include repository/repo.liquid repository=repo %}
  {% endfor %}
</div>
{% endif %}
