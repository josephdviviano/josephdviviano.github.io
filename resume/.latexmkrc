# Every document here uses fontspec with the Brandon Grotesque OpenType family,
# which pdflatex cannot load -- they must be built with xelatex.
#
# $pdf_mode = 5 selects xelatex. The $pdflatex override matters because editors
# (e.g. the LaTeX Workshop default recipe) pass -pdf on the command line, which
# would otherwise reset the mode to pdflatex; redefining the command keeps
# xelatex in play either way.
$pdf_mode = 5;
$pdflatex = 'xelatex %O %S';
$xelatex  = 'xelatex %O %S';
