create table page (
  id serial primary key,
  host varchar(32) not null,
  path varchar(256),
  constraint page_unique unique (host, path)
);

create table message (
  id serial primary key,
  page int not null references page(id),
  selector varchar(256),
  text varchar(256),
  address inet
);

create view page_message as
  select m.id, host, path, text, selector from page join message m on page.id = m.page;
