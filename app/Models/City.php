<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $city_code
 * @property string $city_name
 * @property int $prov_code
 * @property int $is_Urban
 * @property int $locked
 * @property int|null $app_target_hh
 * @property int $4p_areas
 * @property string|null $psgc_cty
 */
class City extends Model
{
    protected $table = 'lib_cities';

    protected $primaryKey = 'city_code';

    public $incrementing = true;

    protected $keyType = 'int';

    public $timestamps = false;

    protected $fillable = [
        'city_code',
        'city_name',
        'prov_code',
        'is_Urban',
        'locked',
        'app_target_hh',
        '4p_areas',
        'psgc_cty',
    ];

    /**
     * Get the province this city belongs to.
     */
    public function province(): BelongsTo
    {
        return $this->belongsTo(Province::class, 'prov_code', 'prov_code');
    }

    /**
     * Get the barangays for this city.
     */
    public function barangays(): HasMany
    {
        return $this->hasMany(Barangay::class, 'city_code', 'city_code');
    }

    /**
     * Get the attendees in this city.
     */
    public function attendees(): HasMany
    {
        return $this->hasMany(Attendee::class, 'city_id', 'city_code');
    }
}
