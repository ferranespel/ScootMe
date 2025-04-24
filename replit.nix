{pkgs}: {
  deps = [
    pkgs.nodejs-18_x
    pkgs.nano
    pkgs.iproute2
    pkgs.psmisc
    pkgs.lsof
    pkgs.jq
  ];
}
