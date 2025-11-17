---
layout: page
title: Street Photography
description: with background image
img: assets/img/photography/street/DSCF4255.jpg
importance: 1
category: photography
related_publications: true
---

Here's a collection of shots I've taken around town. I'll periodicallty update these, but you can browse my Instagram if you want to see more.

{% assign street_images = site.static_files
  | where_exp: "file", "file.path contains '/assets/img/photography/street/'"
  | where_exp: "file", "file.extname == '.jpg'"
  | sort: "path" %}

<div class="row">
  {% for image in street_images %}
    <div class="col-12 col-md-6 mt-3">
      {% capture street_alt %}Street photograph {{ forloop.index }}{% endcapture %}
      {% include figure.liquid zoomable=true path=image.path class="img-fluid rounded z-depth-1" alt=street_alt title=image.name %}
    </div>
  {% endfor %}
</div>