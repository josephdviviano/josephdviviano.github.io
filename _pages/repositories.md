---
layout: page
permalink: /repositories/
title: repositories
description: Some projects I've worked on (that I can talk about).
nav: true
nav_order: 4
---

## Contribution Activity

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/josephdviviano/josephdviviano.github.io/output/github-snake-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/josephdviviano/josephdviviano.github.io/output/github-snake.svg">
  <img alt="Snake eating my GitHub contribution graph" src="https://raw.githubusercontent.com/josephdviviano/josephdviviano.github.io/output/github-snake.svg" style="width: 100%;">
</picture>

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

## Activity Graph

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://github-readme-activity-graph.vercel.app/graph?username=josephdviviano&theme=github-compact&hide_border=true&bg_color=00000000&color=ffffff&line=ffc600&point=ff9d00">
  <source media="(prefers-color-scheme: light)" srcset="https://github-readme-activity-graph.vercel.app/graph?username=josephdviviano&theme=github-light&hide_border=true">
  <img alt="GitHub activity graph" src="https://github-readme-activity-graph.vercel.app/graph?username=josephdviviano&theme=github-light&hide_border=true" style="width: 100%;">
</picture>

---

{% if site.data.repositories.github_repos %}

## Star History

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=mlmed/torchxrayvision,gfnorg/torchgfn,gfnorg/chunk-gfn&type=Date&theme=dark">
  <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=mlmed/torchxrayvision,gfnorg/torchgfn,gfnorg/chunk-gfn&type=Date">
  <img alt="Star history of selected repositories" src="https://api.star-history.com/svg?repos=mlmed/torchxrayvision,gfnorg/torchgfn,gfnorg/chunk-gfn&type=Date" style="width: 100%;">
</picture>

---

## GitHub Repositories

<div class="repositories d-flex flex-wrap flex-md-row flex-column justify-content-between align-items-center">
  {% for repo in site.data.repositories.github_repos %}
    {% include repository/repo.liquid repository=repo %}
  {% endfor %}
</div>
{% endif %}
