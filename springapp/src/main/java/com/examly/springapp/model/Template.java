package com.examly.springapp.model;

import javax.persistence.*;

@Entity
public class Template {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private String name;

	@Lob
	private String data; // could be JSON, SVG, etc.

	public Template() {}

	public Template(String name, String data) {
		this.name = name;
		this.data = data;
	}

	public Long getId() { return id; }
	public void setId(Long id) { this.id = id; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getData() { return data; }
	public void setData(String data) { this.data = data; }
}
