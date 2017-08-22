var data_config = {
    tag: "visualization",
    mode: "local_files",

    title: "OpenUp Dissemination Toolbox",
    input_format: "csv",
    base_unit: "",
    use_area_uri: false,
    is_force_areas: false,
    url_prefix: "",
    
    show_timeline: false,
    show_dropdown: true,
    show_intro: false,
    show_list:true,
    is_force_papers:true,
    content_based: true,

    intro: "intro_ou",

  sort_options: ["title"],

  files: [{
        title: "toolbox",
        file: "./data/toolbox1.csv"
    },
    {
      title: "toolbox2",
      file: "./data/toolbox2.csv"
    }
  ]
};
