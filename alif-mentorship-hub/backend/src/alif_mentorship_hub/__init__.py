try:
    import MySQLdb  # use real mysqlclient if available
except ImportError:
    import pymysql
    pymysql.install_as_MySQLdb()
