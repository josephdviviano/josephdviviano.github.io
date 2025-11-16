---
layout: post
current: post
cover: assets/images/trajectories/alz-cover.jpg # Add image post (optional)
navigation: True
title: "Deep Learning to Detect Early Cognitive Decline"
date: 2018-01-11 13:32:20 +0300
tags: [Publications]
class: post-template
subclass: 'post'
author: josephdviviano
---

Using Siamese Networks, we were able to use a cocktail of MRI scans and gene sequences to predict people who were in most need of future clinical care.

While working at the [Centre for Addiction and Mental Health](https://www.camh.ca/), I had the pleasure of working with [Jon Pipitone](https://scholar.google.com/citations?user=SoMyf3YAAAAJ&hl=en&oi=ao), a computer scientist and climate activist trained at the University of Toronto, and [Nikhil Bhagwat](https://dblp.org/pid/67/8968.html), a defense contractor-turned-biomedical researcher, during my day job keeping the lights on at the [Kimel-Family Translational Imaging-Genetics Lab (TIGRLAB)](http://imaging-genetics.camh.ca/), headed by the now-VP of CAMH research, [Dr. Aristotle Voineskos](https://www.camh.ca/en/science-and-research/science-and-research-staff-directory/aristotlevoineskos). In the field, there was a growing consensus that machine learning was a key to improving psychatric diagnosis and treatment, due to the high variability of outcomes given similar diagnosis using traditional tools like the Diagnostics and Statistical Manual of Mental Disorders ([DSM](https://www.psychiatry.org/psychiatrists/practice/dsm)).

{:refdef: style="text-align: center;"}
![Alzheimer's Disease Progression]({{site.baseurl}}/assets/images/trajectories/alz-progression.jpg)
{: refdef}

The specific problem we wanted to tackle was the detection of the onset of cognitive decline leading to Alzheimer's disease, using the ADNI [Alzheimer's Disease Neuroimaging Initiative](http://adni.loni.usc.edu/) dataset. Being able to do this can be pretty impactful: no treatment can currently reduce the course of Alzheimer's progression, but many treatments can delay the [progression of the disease if it is caught early](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6935598/). This dataset contains MRI scans, SNP hits from blood draws, and cognitive scores over multiple timepoints for many older individual. The cognitive scores allowed us to identify multiple "cognitive trajectories" in the dataset by clustering the two subscales: the "Mini Mental State Exam (MMSE)" and the "Alzheimer's Disease Assessment Scale" (ADAS-13). From both scales, we found a subset of individuals that did not experience substantial decline. Using MMSE, we also found a distinct subset that experienced decline, and for ADAS-13, we found two decliner groups, with one group declining more rapidly.

{:refdef: style="text-align: center;"}
![Identified Trajectories]({{site.baseurl}}/assets/images/trajectories/trajectories.png)
{: refdef}

Having defined our groups, we then calculated cortical thickness measures from the MRI scans. This measures the thickness of the grey matter across the cortical sheet of the brain: the thickness of the cortex at different regions of the cortex is [associated with differing densities of glial in those regions](https://www.pnas.org/content/110/4/1488), the [ability of the region to integrate signals to be set to other regions](https://www.cell.com/neuron/fulltext/S0896-6273(18)30956-5), is known to vary across individuals with different neurological disorders, and has high test-retest reliability due to the stability of the signal (unlike fMRI, which is much more susceptible to the patient's cognitive state and other sources of noise).

{:refdef: style="text-align: center;"}
![Cortical Thickness]({{site.baseurl}}/assets/images/trajectories/thickness.png)
{: refdef}

Since we wanted to predict decline, we fed pairs of images from adjacent timepoints into a Siamese network, which allowed us to learn a distance embedding that represented the difference between the brain scans over time. Siamese networks are cool because they allow you to input two images of the same modality to calculate some kind of "task-dependent difference metric". This is far less fragile than calculating the differences between the data in the input space. We incorporated genetic information into the prediction by multiplying this embedding by the APOE4 status of the individual: this gene variant is associated with the [development of Alzheimer's disease and disease progression at an earlier age](https://www.nia.nih.gov/health/alzheimers-disease-genetics-fact-sheet).

{:refdef: style="text-align: center;"}
![Model Overview]({{site.baseurl}}/assets/images/trajectories/overview.png)
{: refdef}

The results of the study were clear: adding a second time-point made trajectory prediction far easier for all models, and the use of Siamese networks to build a distance embedding outperformed all other baselines tested. I'm proud of this work because, while it didn't produce a model that was immediately clinically useful, we laid the groundwork for combining multiple clinically-meaningful biological signals with a longitudinal framework for modeling disease progression, and I believe this general direction will lead to useful future diagnostics (especially if we can get the cost of an MRI scan down to the level where routine screening would be feasible).

For all of the details, see [the full paper here.](https://journals.plos.org/ploscompbiol/article?rev=2&id=10.1371/journal.pcbi.1006376).
