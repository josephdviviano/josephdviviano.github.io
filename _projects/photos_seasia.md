---
layout: page
title: project 2
description: Shots I recently took on a trip to Singapore, Thailand, and Cambodia.
img: assets/img/photography/seasia/DSCF3163.RAF.jpg
importance: 2
category: photography
giscus_comments: true
---

Scenes from wandering through Southeast Asia—markets, alleyways, temples, scooters, and sunsets, all shot on the fly.

{% assign seasia_images = site.static_files
  | where_exp: "file", "file.path contains '/assets/img/photography/seasia/'"
  | where_exp: "file", "file.extname == '.jpg'"
  | sort: "path" %}

<div class="row">
  {% for image in seasia_images %}
    <div class="col-12 col-md-6 mt-3">
      {% include figure.liquid
        zoomable=true
        path=image.path
        class="img-fluid rounded z-depth-1"
        alt="Southeast Asia photograph {{ forloop.index }}"
        title=image.name %}
    </div>
  {% endfor %}
</div>