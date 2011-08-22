require 'net/http'
module Rack
  class Livestats
    def initialize(app)
      @app = app
    end

    def call(env)
      status, headers, response = @app.call(env)
      p status.inspect
      p headers.inspect
      p response.inspect
      [status, headers, response]
    end
  end
end