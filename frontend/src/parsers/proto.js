import protobuf from 'protobufjs';

// ─── GeoSite schema ───────────────────────────────────────────────

const geositeRoot = new protobuf.Root();

const DomainType = new protobuf.Enum('Type', {
  Plain: 0,
  Regex: 1,
  RootDomain: 2,
  Full: 3,
});

const DomainAttribute = new protobuf.Type('Attribute')
  .add(new protobuf.Field('key', 1, 'string'))
  .add(new protobuf.OneOf('typed_value')
    .add(new protobuf.Field('bool_value', 2, 'bool'))
    .add(new protobuf.Field('int_value', 3, 'int64'))
  );

const Domain = new protobuf.Type('Domain')
  .add(DomainType)
  .add(new protobuf.Field('type', 1, 'Type'))
  .add(new protobuf.Field('value', 2, 'string'))
  .add(new protobuf.Field('attribute', 3, 'Attribute', 'repeated'));

const GeoSite = new protobuf.Type('GeoSite')
  .add(new protobuf.Field('country_code', 1, 'string'))
  .add(new protobuf.Field('domain', 2, 'Domain', 'repeated'));

const GeoSiteList = new protobuf.Type('GeoSiteList')
  .add(new protobuf.Field('entry', 1, 'GeoSite', 'repeated'));

geositeRoot.add(GeoSiteList);
GeoSiteList.add(GeoSite);
GeoSite.add(Domain);
Domain.add(DomainAttribute);

// ─── GeoIP schema ──────────────────────────────────────────────────

const geoipRoot = new protobuf.Root();

const CIDR = new protobuf.Type('CIDR')
  .add(new protobuf.Field('ip', 1, 'bytes'))
  .add(new protobuf.Field('prefix', 2, 'uint32'));

const GeoIP = new protobuf.Type('GeoIP')
  .add(new protobuf.Field('country_code', 1, 'string'))
  .add(new protobuf.Field('cidr', 2, 'CIDR', 'repeated'))
  .add(new protobuf.Field('inverse_match', 3, 'bool'));

const GeoIPList = new protobuf.Type('GeoIPList')
  .add(new protobuf.Field('entry', 1, 'GeoIP', 'repeated'));

geoipRoot.add(GeoIPList);
GeoIPList.add(GeoIP);
GeoIP.add(CIDR);

export { GeoSiteList, GeoIPList };
